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
import {
  createVoucherIssueBody,
  createVoucherOverrideRequestBody,
} from "../support/fixtures/factories/voucher-override-factory";

type ActorAppParams = {
  actorId: string;
  tenantId: string;
  roles: string[];
};

type Envelope = {
  success: boolean;
  reason?: string;
  correlation_id?: string;
  data?: {
    voucher_id?: string;
    status?: string;
    voucher_type?: string;
  };
};

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
  const authorizedActorId = faker.string.uuid();
  const unauthorizedActorId = faker.string.uuid();
  const partnerAgencyId = faker.string.uuid();
  const partnerTokenId = faker.string.uuid();
  const partnerToken = `partner-token-${faker.string.alphanumeric(24)}`;

  const cleanup: Array<() => Promise<void>> = [];

  try {
    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "warning";
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantId, host);
    cleanup.push(async () => {
      await db("platform.tenant_apps").where({ tenant_id: tenantId }).del();
      await db("platform.tenants").where({ tenant_id: tenantId }).del();
    });

    await db("memberships").insert([
      {
        id: faker.string.uuid(),
        tenant_id: tenantId,
        actor_id: authorizedActorId,
        role: "store_admin",
      },
      {
        id: faker.string.uuid(),
        tenant_id: tenantId,
        actor_id: unauthorizedActorId,
        role: "steward_initiate_only",
      },
    ]);
    cleanup.push(async () => {
      await db("memberships")
        .whereIn("actor_id", [authorizedActorId, unauthorizedActorId])
        .andWhere({ tenant_id: tenantId })
        .del();
    });

    await db("partner_agencies").insert({
      id: partnerAgencyId,
      tenant_id: tenantId,
      name: "Override Policy Partner",
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

    const duplicateVoucherId = await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Taylor",
      lastName: "Override",
      dateOfBirth: "1989-02-14",
      createdAt: new Date(),
    });

    const authorizedApp = buildActorApp({
      actorId: authorizedActorId,
      tenantId,
      roles: ["store_admin"],
    });
    await authorizedApp.ready();

    const unauthorizedApp = buildActorApp({
      actorId: unauthorizedActorId,
      tenantId,
      roles: ["steward_initiate_only"],
    });
    await unauthorizedApp.ready();

    const partnerApp = buildPartnerApp();
    await partnerApp.ready();

    // GIVEN duplicate warning eligible for override
    // WHEN authorized actor submits override reason + duplicate reference
    const authorizedResponse = await authorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    // THEN issuance proceeds
    assert.equal(authorizedResponse.statusCode, 200);
    const authorizedBody = parseJson<Envelope>(authorizedResponse.body);
    assert.equal(authorizedBody.success, true);
    assert.equal(typeof authorizedBody.data?.voucher_id, "string");
    assert.equal(authorizedBody.data?.status, "active");

    // THEN override reason is captured in append-only audit event
    const overrideAudit = await db("audit_events")
      .select("event_type", "reason", "tenant_id", "actor_id", "correlation_id", "metadata")
      .where({
        tenant_id: tenantId,
        actor_id: authorizedActorId,
        event_type: "voucher.issuance.override",
      })
      .orderBy("created_at", "desc")
      .first();
    assert.ok(overrideAudit, "expected voucher.issuance.override audit event");
    assert.equal(overrideAudit.reason, "Approved exception with documented policy reason");
    assert.equal(typeof overrideAudit.correlation_id, "string");

    // GIVEN missing override reason
    // WHEN authorized actor submits blank reason
    const missingReasonResponse = await authorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
        override_reason: "   ",
      }),
    });

    // THEN request is refused with FR0 envelope semantics
    assert.equal(missingReasonResponse.statusCode, 200);
    const missingReasonBody = parseJson<Envelope>(missingReasonResponse.body);
    assert.equal(missingReasonBody.success, false);
    assert.equal(missingReasonBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof missingReasonBody.correlation_id, "string");

    // GIVEN unauthorized JWT role
    // WHEN override is attempted
    const unauthorizedResponse = await unauthorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    // THEN override is refused and no issuance side effects occur
    assert.equal(unauthorizedResponse.statusCode, 200);
    const unauthorizedBody = parseJson<Envelope>(unauthorizedResponse.body);
    assert.equal(unauthorizedBody.success, false);
    assert.equal(unauthorizedBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof unauthorizedBody.correlation_id, "string");

    // GIVEN partner-token request
    // WHEN override is attempted
    const partnerOverrideResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host,
        [PARTNER_TOKEN_HEADER]: partnerToken,
      },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    // THEN partner-token override is refused with FR0 semantics
    assert.equal(partnerOverrideResponse.statusCode, 200);
    const partnerOverrideBody = parseJson<Envelope>(partnerOverrideResponse.body);
    assert.equal(partnerOverrideBody.success, false);
    assert.equal(partnerOverrideBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof partnerOverrideBody.correlation_id, "string");

    await partnerApp.close();
    await unauthorizedApp.close();
    await authorizedApp.close();

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
