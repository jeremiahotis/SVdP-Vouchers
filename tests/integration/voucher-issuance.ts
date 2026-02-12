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

type ActorAppParams = {
  actorId: string;
  tenantId: string;
  roles: string[];
};

type VoucherIssueBody = {
  voucher_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  household_adults: number;
  household_children: number;
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

async function waitForRow<T>(
  load: () => Promise<T | undefined>,
  timeoutMs = 1500,
): Promise<T | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = await load();
    if (row) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return load();
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

async function run() {
  const db = knex(config);
  const tenantId = faker.string.uuid();
  const host = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const stewardActorId = faker.string.uuid();
  const initiateOnlyActorId = faker.string.uuid();
  const partnerAgencyId = faker.string.uuid();
  const partnerTokenId = faker.string.uuid();
  const partnerToken = `partner-token-${faker.string.alphanumeric(24)}`;

  const cleanup: Array<() => Promise<void>> = [];

  try {
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
        actor_id: stewardActorId,
        role: "steward",
      },
      {
        id: faker.string.uuid(),
        tenant_id: tenantId,
        actor_id: initiateOnlyActorId,
        role: "steward_initiate_only",
      },
    ]);
    cleanup.push(async () => {
      await db("memberships").whereIn("actor_id", [stewardActorId, initiateOnlyActorId]).del();
    });

    await db("partner_agencies").insert({
      id: partnerAgencyId,
      tenant_id: tenantId,
      name: "Partner Agency",
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

    const issueResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({ voucher_type: "clothing" }),
    });

    assert.equal(issueResponse.statusCode, 200);
    const issueBody = parseJson<{
      success: boolean;
      data?: { voucher_id?: string; status?: string; voucher_type?: string };
    }>(issueResponse.body);
    assert.equal(issueBody.success, true);
    assert.equal(issueBody.data?.status, "active");
    assert.equal(issueBody.data?.voucher_type, "clothing");
    assert.equal(typeof issueBody.data?.voucher_id, "string");

    const issuedVoucherId = issueBody.data?.voucher_id as string;
    const issuedVoucher = await waitForRow(async () =>
      db("vouchers")
        .select("id", "status", "tenant_id", "partner_agency_id")
        .where({ id: issuedVoucherId, tenant_id: tenantId })
        .first(),
    );
    assert.equal(issuedVoucher?.status, "active");
    assert.equal(issuedVoucher?.partner_agency_id, null);

    const authSnapshot = await waitForRow(async () =>
      db("voucher_authorizations")
        .select("voucher_id", "tenant_id", "voucher_type", "first_name", "last_name")
        .where({ voucher_id: issuedVoucherId, tenant_id: tenantId })
        .first(),
    );
    assert.ok(authSnapshot, "authorization snapshot should be persisted for issued voucher");

    const disallowedResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({ voucher_type: "coats" }),
    });
    assert.equal(disallowedResponse.statusCode, 200);
    const disallowedBody = parseJson<{ success: boolean; reason?: string }>(disallowedResponse.body);
    assert.equal(disallowedBody.success, false);
    assert.equal(disallowedBody.reason, REFUSAL_REASONS.notAuthorizedForAction);

    const initiateOnlyApp = buildActorApp({
      actorId: initiateOnlyActorId,
      tenantId,
      roles: ["steward_initiate_only"],
    });
    await initiateOnlyApp.ready();

    const pendingResponse = await initiateOnlyApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createIssuePayload({ voucher_type: "clothing" }),
    });
    assert.equal(pendingResponse.statusCode, 200);
    const pendingBody = parseJson<{
      success: boolean;
      data?: { request_id?: string; status?: string; voucher_type?: string; voucher_id?: string };
    }>(pendingResponse.body);
    assert.equal(pendingBody.success, true);
    assert.equal(pendingBody.data?.status, "pending");
    assert.equal(pendingBody.data?.voucher_type, "clothing");
    assert.equal(typeof pendingBody.data?.request_id, "string");
    assert.equal(pendingBody.data?.voucher_id, undefined);

    const pendingRequest = await waitForRow(async () =>
      db("voucher_requests")
        .select("id", "status", "tenant_id")
        .where({ id: pendingBody.data?.request_id, tenant_id: tenantId })
        .first(),
    );
    assert.equal(pendingRequest?.status, "pending");

    const partnerApp = buildPartnerApp();
    await partnerApp.ready();

    const partnerIssueResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host,
        [PARTNER_TOKEN_HEADER]: partnerToken,
      },
      payload: createIssuePayload({
        voucher_type: "clothing",
        first_name: "Pat",
        last_name: "Partner",
        date_of_birth: "1984-06-20",
      }),
    });
    assert.equal(partnerIssueResponse.statusCode, 200);
    const partnerIssueBody = parseJson<{
      success: boolean;
      data?: { voucher_id?: string; status?: string; voucher_type?: string };
    }>(partnerIssueResponse.body);
    assert.equal(partnerIssueBody.success, true);
    assert.equal(partnerIssueBody.data?.status, "active");
    assert.equal(partnerIssueBody.data?.voucher_type, "clothing");
    assert.equal(typeof partnerIssueBody.data?.voucher_id, "string");

    const partnerVoucher = await waitForRow(async () =>
      db("vouchers")
        .select("id", "tenant_id", "partner_agency_id")
        .where({ id: partnerIssueBody.data?.voucher_id, tenant_id: tenantId })
        .first(),
    );
    assert.equal(partnerVoucher?.partner_agency_id, partnerAgencyId);

    const partnerSnapshot = await waitForRow(async () =>
      db("voucher_authorizations")
        .select("voucher_id", "partner_agency_id")
        .where({
          voucher_id: partnerIssueBody.data?.voucher_id,
          tenant_id: tenantId,
        })
        .first(),
    );
    assert.equal(partnerSnapshot?.partner_agency_id, partnerAgencyId);

    const overrideResponse = await stewardApp.inject({
      method: "POST",
      url: `/v1/vouchers?tenant_id=${tenantId}`,
      headers: { host },
      payload: createIssuePayload({ voucher_type: "clothing" }),
    });
    assert.equal(overrideResponse.statusCode, 200);
    const overrideBody = parseJson<{ success: boolean; reason?: string }>(overrideResponse.body);
    assert.equal(overrideBody.success, false);
    assert.equal(overrideBody.reason, REFUSAL_REASONS.tenantContextMismatch);

    const bodyOverrideResponse = await stewardApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: {
        ...createIssuePayload({
          voucher_type: "clothing",
          first_name: "Blake",
          last_name: "Override",
          date_of_birth: "1981-02-11",
        }),
        tenant_id: "",
      },
    });
    assert.equal(bodyOverrideResponse.statusCode, 200);
    const bodyOverride = parseJson<{
      success: boolean;
      data?: { voucher_id?: string; status?: string; voucher_type?: string };
    }>(bodyOverrideResponse.body);
    assert.equal(bodyOverride.success, true);
    assert.equal(bodyOverride.data?.status, "active");
    assert.equal(typeof bodyOverride.data?.voucher_id, "string");

    const bodyOverrideVoucher = await waitForRow(async () =>
      db("vouchers")
        .select("id", "tenant_id")
        .where({
          id: bodyOverride.data?.voucher_id,
          tenant_id: tenantId,
        })
        .first(),
    );
    assert.ok(bodyOverrideVoucher, "body tenant override must not change host-derived tenant scope");

    await assert.rejects(
      db("voucher_authorizations")
        .where({
          voucher_id: issuedVoucherId,
          tenant_id: tenantId,
        })
        .update({ first_name: "Mutated" }),
      /immutable/i,
    );

    await stewardApp.close();
    await initiateOnlyApp.close();
    await partnerApp.close();
  } finally {
    for (const runCleanup of cleanup.reverse()) {
      await runCleanup();
    }
    await db.destroy();
    await closeDb();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
