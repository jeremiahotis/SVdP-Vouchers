import assert from "node:assert/strict";
import knex, { type Knex } from "knex";
import { faker } from "@faker-js/faker";
import Fastify from "fastify";
import config from "../../apps/api/db/knexfile";
import { authHook } from "../../apps/api/src/auth/hook";
import { PARTNER_TOKEN_HEADER, hashPartnerToken } from "../../apps/api/src/auth/partner-token";
import { APP_KEY } from "../../apps/api/src/config/app";
import { closeDb } from "../../apps/api/src/db/client";
import { dbErrorHook, dbRequestHook, dbResponseHook } from "../../apps/api/src/db/hooks";
import { registerCorrelation } from "../../apps/api/src/observability/correlation";
import { registerRoutes } from "../../apps/api/src/routes";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";
import { REFUSAL_REASONS } from "../../packages/contracts/src/constants/refusal-reasons";

type ActorAppParams = { actorId: string; tenantId: string; roles: string[] };
type VoucherIssueBody = {
  voucher_type: string; first_name: string; last_name: string; date_of_birth: string;
  household_adults: number; household_children: number;
};
type Envelope = {
  success: boolean; reason?: string; correlation_id?: string;
  details?: {
    duplicate_outcome?: string;
    override_eligible?: boolean;
    matched_voucher_id?: string;
    duplicate_window_days?: number;
  };
  data?: { voucher_id?: string; status?: string; voucher_type?: string };
};

const DUPLICATE_REASON = REFUSAL_REASONS.duplicateInPolicyWindow;
const DUPLICATE_WARNING_REASON = REFUSAL_REASONS.duplicateWarningRequiresOverride;

function buildPartnerApp() {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onRequest", authHook);
  app.addHook("onRequest", tenantContextHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  registerRoutes(app);
  return app;
}

function buildActorApp(params: ActorAppParams) {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onRequest", (request, _reply, done) => {
    request.authContext = {
      actorId: params.actorId,
      tenantId: params.tenantId,
      roles: params.roles,
    };
    done();
  });
  app.addHook("onRequest", tenantContextHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  registerRoutes(app);
  return app;
}

function parseJson<T>(body: string): T {
  return JSON.parse(body) as T;
}

function createIssuePayload(overrides: Partial<VoucherIssueBody> = {}): VoucherIssueBody {
  return {
    voucher_type: "clothing",
    first_name: "Alex",
    last_name: "Neighbor",
    date_of_birth: "1988-01-05",
    household_adults: 1,
    household_children: 2,
    ...overrides,
  };
}

async function seedTenant(db: Knex, tenantId: string, host: string) {
  await db("platform.tenants")
    .insert({ tenant_id: tenantId, host, tenant_slug: host.split(".")[0], status: "active" })
    .onConflict("tenant_id")
    .merge({ host, status: "active", updated_at: db.fn.now() });

  await db("platform.tenant_apps")
    .insert({ tenant_id: tenantId, app_key: APP_KEY, enabled: true })
    .onConflict(["tenant_id", "app_key"])
    .merge({ enabled: true, updated_at: db.fn.now() });
}

async function seedDuplicateCandidate(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  createdAt: Date;
}) {
  const voucherId = faker.string.uuid();
  const authorizationId = faker.string.uuid();

  await params.db("vouchers").insert({
    id: voucherId,
    tenant_id: params.tenantId,
    status: "active",
    voucher_type: params.voucherType,
    created_at: params.createdAt,
    updated_at: params.createdAt,
  });

  await params.db("voucher_authorizations").insert({
    id: authorizationId,
    voucher_id: voucherId,
    tenant_id: params.tenantId,
    voucher_type: params.voucherType,
    first_name: params.firstName,
    last_name: params.lastName,
    date_of_birth: params.dateOfBirth,
    household_adults: 1,
    household_children: 0,
    issuer_mode: "auth",
    actor_id: faker.string.uuid(),
    created_at: params.createdAt,
  });

  return voucherId;
}

async function run() {
  const db = knex(config);
  const originalPolicyAction = process.env.VOUCHER_DUPLICATE_POLICY_ACTION;

  const tenantId = faker.string.uuid();
  const host = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const stewardActorId = faker.string.uuid();
  const partnerAgencyId = faker.string.uuid();
  const partnerTokenId = faker.string.uuid();
  const partnerToken = `partner-token-${faker.string.alphanumeric(24)}`;

  const cleanup: Array<() => Promise<void>> = [];

  try {
    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "refusal";
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantId, host);
    cleanup.push(async () => {
      await db("platform.tenant_apps").where({ tenant_id: tenantId }).del();
      await db("platform.tenants").where({ tenant_id: tenantId }).del();
    });

    await db("memberships").insert({
      id: faker.string.uuid(),
      tenant_id: tenantId,
      actor_id: stewardActorId,
      role: "steward",
    });
    cleanup.push(async () => {
      await db("memberships").where({ actor_id: stewardActorId, tenant_id: tenantId }).del();
    });

    await db("partner_agencies").insert({
      id: partnerAgencyId,
      tenant_id: tenantId,
      name: "Duplicate Policy Partner",
      status: "active",
    });
    await db("partner_tokens").insert({
      id: partnerTokenId,
      tenant_id: tenantId,
      partner_agency_id: partnerAgencyId,
      token_hash: hashPartnerToken(partnerToken),
      status: "active",
      form_config: {
        allowed_voucher_types: ["clothing"],
        intro_text: "",
        rules_list: [],
      },
    });
    cleanup.push(async () => {
      await db("partner_tokens").where({ id: partnerTokenId }).del();
      await db("partner_agencies").where({ id: partnerAgencyId }).del();
    });

    const stewardApp = buildActorApp({
      actorId: stewardActorId,
      tenantId,
      roles: ["steward"],
    });
    await stewardApp.ready();

    const partnerApp = buildPartnerApp();
    await partnerApp.ready();

    // [P0] In-window duplicate should refuse for steward path.
    await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Alex",
      lastName: "Neighbor",
      dateOfBirth: "1988-01-05",
      createdAt: new Date(),
    });

    const duplicateStewardResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({
        first_name: " alex ",
        last_name: "NEIGHBOR",
        date_of_birth: "1988-01-05",
      }),
    });
    assert.equal(duplicateStewardResponse.statusCode, 200);
    const duplicateStewardBody = parseJson<Envelope>(duplicateStewardResponse.body);
    assert.equal(duplicateStewardBody.success, false);
    assert.equal(duplicateStewardBody.reason, DUPLICATE_REASON);

    // [P1] Out-of-window duplicate candidate should not block issuance.
    const oldDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Jordan",
      lastName: "Client",
      dateOfBirth: "1990-04-10",
      createdAt: oldDate,
    });

    const outOfWindowResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({
        first_name: "Jordan",
        last_name: "Client",
        date_of_birth: "1990-04-10",
      }),
    });
    assert.equal(outOfWindowResponse.statusCode, 200);
    const outOfWindowBody = parseJson<Envelope>(outOfWindowResponse.body);
    assert.equal(outOfWindowBody.success, true);
    assert.equal(typeof outOfWindowBody.data?.voucher_id, "string");

    // [P0] Partner-token path should apply same duplicate policy outcome.
    await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Pat",
      lastName: "Voucher",
      dateOfBirth: "1985-09-12",
      createdAt: new Date(),
    });

    const duplicatePartnerResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host,
        [PARTNER_TOKEN_HEADER]: partnerToken,
      },
      payload: createIssuePayload({
        first_name: "Pat",
        last_name: "Voucher",
        date_of_birth: "1985-09-12",
      }),
    });
    assert.equal(duplicatePartnerResponse.statusCode, 200);
    const duplicatePartnerBody = parseJson<Envelope>(duplicatePartnerResponse.body);
    assert.equal(duplicatePartnerBody.success, false);
    assert.equal(duplicatePartnerBody.reason, DUPLICATE_REASON);

    // [P1] Duplicate refusals include FR0 envelope fields and correlation linking.
    assert.equal(typeof duplicateStewardBody.correlation_id, "string");
    assert.equal(
      String(duplicateStewardResponse.headers["x-correlation-id"]),
      duplicateStewardBody.correlation_id,
    );

    // [P0] Warning policy mode should return warning reason and warning details.
    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "warning";
    const warningDuplicateVoucherId = await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Wendy",
      lastName: "Warning",
      dateOfBirth: "1991-03-17",
      createdAt: new Date(),
    });

    const warningStewardResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({
        first_name: "Wendy",
        last_name: "Warning",
        date_of_birth: "1991-03-17",
      }),
    });
    assert.equal(warningStewardResponse.statusCode, 200);
    const warningStewardBody = parseJson<Envelope>(warningStewardResponse.body);
    assert.equal(warningStewardBody.success, false);
    assert.equal(warningStewardBody.reason, DUPLICATE_WARNING_REASON);
    assert.equal(warningStewardBody.details?.duplicate_outcome, "warning");
    assert.equal(warningStewardBody.details?.override_eligible, true);
    assert.equal(warningStewardBody.details?.matched_voucher_id, warningDuplicateVoucherId);
    assert.equal(typeof warningStewardBody.correlation_id, "string");

    const warningPartnerResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host,
        [PARTNER_TOKEN_HEADER]: partnerToken,
      },
      payload: createIssuePayload({
        first_name: "Wendy",
        last_name: "Warning",
        date_of_birth: "1991-03-17",
      }),
    });
    assert.equal(warningPartnerResponse.statusCode, 200);
    const warningPartnerBody = parseJson<Envelope>(warningPartnerResponse.body);
    assert.equal(warningPartnerBody.success, false);
    assert.equal(warningPartnerBody.reason, DUPLICATE_WARNING_REASON);
    assert.equal(warningPartnerBody.details?.duplicate_outcome, "warning");
    assert.equal(warningPartnerBody.details?.override_eligible, true);
    assert.equal(warningPartnerBody.details?.matched_voucher_id, warningDuplicateVoucherId);
    assert.equal(typeof warningPartnerBody.correlation_id, "string");

    await partnerApp.close();
    await stewardApp.close();
    await cleanup.reduceRight(
      (promise, fn) => promise.then(() => fn()),
      Promise.resolve(),
    );
  } finally {
    if (typeof originalPolicyAction === "undefined") {
      delete process.env.VOUCHER_DUPLICATE_POLICY_ACTION;
    } else {
      process.env.VOUCHER_DUPLICATE_POLICY_ACTION = originalPolicyAction;
    }
    await closeDb();
    await db.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
