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
import {
  getActivePartnerTokenForAdmin,
  getPartnerFormConfigByToken,
  updateActivePartnerTokenFormConfig,
} from "../../apps/api/src/partner/form-config";
import { issueVoucherForPartnerToken } from "../../apps/api/src/partner/issuance";
import { registerRoutes } from "../../apps/api/src/routes";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";
import { refusalReasons } from "../../apps/api/src/tenancy/refusal";
import {
  PARTNER_FORM_CONFIG_LIMITS,
  validatePartnerFormConfigPayload,
} from "../../packages/contracts/src/constants/partner-form-config";

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

function buildStoreAdminApp(params: { actorId: string; tenantId: string }) {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onRequest", (request, _reply, done) => {
    request.authContext = {
      actorId: params.actorId,
      tenantId: params.tenantId,
      roles: ["store_admin"],
    };
    done();
  });
  app.addHook("onRequest", tenantContextHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  registerRoutes(app);
  return app;
}

function parseJson(body: string) {
  return JSON.parse(body) as Record<string, unknown>;
}

async function run() {
  const db = knex(config);

  const tenantA = faker.string.uuid();
  const hostA = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const tenantB = faker.string.uuid();
  const hostB = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const partnerAgencyA = faker.string.uuid();
  const partnerAgencyB = faker.string.uuid();
  const partnerTokenA = `partner-token-a-${faker.string.alphanumeric(24)}`;
  const partnerTokenAId = faker.string.uuid();
  const partnerTokenASecondary = `partner-token-a-${faker.string.alphanumeric(24)}`;
  const partnerTokenASecondaryId = faker.string.uuid();
  const partnerTokenBId = faker.string.uuid();
  const storeAdminActorId = faker.string.uuid();

  const cleanup: Array<() => Promise<void>> = [];

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantA, hostA);
    await seedTenant(db, tenantB, hostB);
    cleanup.push(async () => {
      await db("platform.tenant_apps").whereIn("tenant_id", [tenantA, tenantB]).del();
      await db("platform.tenants").whereIn("tenant_id", [tenantA, tenantB]).del();
    });

    await db("partner_agencies").insert([
      { id: partnerAgencyA, tenant_id: tenantA, name: "Partner A", status: "active" },
      { id: partnerAgencyB, tenant_id: tenantB, name: "Partner B", status: "active" },
    ]);
    cleanup.push(async () => {
      await db("partner_agencies").whereIn("id", [partnerAgencyA, partnerAgencyB]).del();
    });

    await db("partner_tokens").insert([
      {
        id: partnerTokenAId,
        tenant_id: tenantA,
        partner_agency_id: partnerAgencyA,
        token_hash: hashPartnerToken(partnerTokenA),
        status: "active",
        form_config: {},
      },
      {
        id: partnerTokenASecondaryId,
        tenant_id: tenantA,
        partner_agency_id: partnerAgencyA,
        token_hash: hashPartnerToken(partnerTokenASecondary),
        status: "active",
        form_config: {},
      },
      {
        id: partnerTokenBId,
        tenant_id: tenantB,
        partner_agency_id: partnerAgencyB,
        token_hash: hashPartnerToken(`partner-token-b-${faker.string.alphanumeric(24)}`),
        status: "active",
        form_config: {},
      },
    ]);
    cleanup.push(async () => {
      await db("partner_tokens")
        .whereIn("id", [partnerTokenAId, partnerTokenASecondaryId, partnerTokenBId])
        .del();
    });

    const storeAdminMembershipId = faker.string.uuid();
    await db("memberships").insert({
      id: storeAdminMembershipId,
      tenant_id: tenantA,
      actor_id: storeAdminActorId,
      role: "store_admin",
    });
    cleanup.push(async () => {
      await db("memberships").where({ id: storeAdminMembershipId }).del();
    });

    const validated = validatePartnerFormConfigPayload({
      allowed_voucher_types: [" furniture ", "clothing", "Furniture"],
      intro_text: "<strong>Welcome</strong> partner",
      rules_list: [" Bring ID ", "<em>Bring ID</em>", "", "No resale"],
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) {
      throw new Error("expected valid partner form config payload");
    }

    const invalidVoucherType = validatePartnerFormConfigPayload({
      allowed_voucher_types: [
        "a".repeat(PARTNER_FORM_CONFIG_LIMITS.maxVoucherTypeLength + 1),
      ],
      intro_text: "Ok",
      rules_list: [],
    });
    assert.equal(invalidVoucherType.ok, false);
    if (!invalidVoucherType.ok) {
      assert.ok(
        invalidVoucherType.errors.some((error) => error.field === "allowed_voucher_types"),
      );
    }

    const invalidIntro = validatePartnerFormConfigPayload({
      allowed_voucher_types: ["clothing"],
      intro_text: "a".repeat(PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength + 1),
      rules_list: [],
    });
    assert.equal(invalidIntro.ok, false);
    if (!invalidIntro.ok) {
      assert.ok(invalidIntro.errors.some((error) => error.field === "intro_text"));
    }

    const invalidRules = validatePartnerFormConfigPayload({
      allowed_voucher_types: ["clothing"],
      intro_text: "Ok",
      rules_list: ["a".repeat(PARTNER_FORM_CONFIG_LIMITS.maxRuleLength + 1)],
    });
    assert.equal(invalidRules.ok, false);
    if (!invalidRules.ok) {
      assert.ok(invalidRules.errors.some((error) => error.field === "rules_list"));
    }

    const updated = await updateActivePartnerTokenFormConfig({
      db,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
      config: validated.value,
    });
    assert.ok(updated, "expected active token update to succeed");
    assert.ok(
      updated?.tokenId === partnerTokenAId || updated?.tokenId === partnerTokenASecondaryId,
      "expected update to return an active partner token id",
    );
    assert.deepStrictEqual(updated?.config.allowed_voucher_types, ["furniture", "clothing"]);
    assert.equal(updated?.config.intro_text, "Welcome partner");
    assert.deepStrictEqual(updated?.config.rules_list, ["Bring ID", "No resale"]);

    const tokenConfigs = await db("partner_tokens")
      .select("id", "form_config")
      .whereIn("id", [partnerTokenAId, partnerTokenASecondaryId]);
    for (const row of tokenConfigs) {
      assert.deepStrictEqual(
        row.form_config,
        updated?.config,
        "expected all active partner tokens to receive updated form config",
      );
    }

    const adminConfig = await getActivePartnerTokenForAdmin({
      db,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
    });
    assert.ok(adminConfig, "expected admin config lookup");
    assert.deepStrictEqual(adminConfig?.config.allowed_voucher_types, ["furniture", "clothing"]);

    const partnerTokenConfig = await getPartnerFormConfigByToken({
      db,
      tokenId: partnerTokenAId,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
    });
    assert.ok(partnerTokenConfig, "expected token config lookup");
    assert.deepStrictEqual(partnerTokenConfig?.allowed_voucher_types, ["furniture", "clothing"]);
    assert.equal(partnerTokenConfig?.intro_text, "Welcome partner");
    assert.deepStrictEqual(partnerTokenConfig?.rules_list, ["Bring ID", "No resale"]);

    const partnerTokenSecondaryConfig = await getPartnerFormConfigByToken({
      db,
      tokenId: partnerTokenASecondaryId,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
    });
    assert.ok(partnerTokenSecondaryConfig, "expected secondary token config lookup");
    assert.deepStrictEqual(partnerTokenSecondaryConfig?.allowed_voucher_types, ["furniture", "clothing"]);
    assert.equal(partnerTokenSecondaryConfig?.intro_text, "Welcome partner");
    assert.deepStrictEqual(partnerTokenSecondaryConfig?.rules_list, ["Bring ID", "No resale"]);

    const denied = await issueVoucherForPartnerToken({
      db,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
      tokenId: partnerTokenAId,
      voucherType: "coats",
      payload: {
        voucher_type: "coats",
        first_name: "Denied",
        last_name: "Applicant",
        date_of_birth: "1990-01-01",
        household_adults: 1,
        household_children: 0,
      },
      correlationId: faker.string.uuid(),
    });
    assert.equal(denied.ok, false);
    if (!denied.ok) {
      assert.equal(denied.reason, refusalReasons.notAuthorizedForAction);
    }

    const deniedAudit = await db("audit_events")
      .where({
        event_type: "partner.issuance.refused",
        tenant_id: tenantA,
        partner_agency_id: partnerAgencyA,
        reason: refusalReasons.notAuthorizedForAction,
      })
      .first();
    assert.ok(deniedAudit, "expected partner issuance refusal audit event");

    const allowed = await issueVoucherForPartnerToken({
      db,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyA,
      tokenId: partnerTokenAId,
      voucherType: "furniture",
      payload: {
        voucher_type: "furniture",
        first_name: "Allowed",
        last_name: "Applicant",
        date_of_birth: "1991-01-01",
        household_adults: 1,
        household_children: 1,
      },
      correlationId: faker.string.uuid(),
    });
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.equal(allowed.voucherType, "furniture");
      const voucherRow = await db("vouchers")
        .where({
          id: allowed.voucherId,
          tenant_id: tenantA,
          partner_agency_id: partnerAgencyA,
          status: "active",
        })
        .first();
      assert.ok(voucherRow, "expected issued voucher row to be persisted");
    }

    const crossTenantRead = await getPartnerFormConfigByToken({
      db,
      tokenId: partnerTokenAId,
      tenantId: tenantB,
      partnerAgencyId: partnerAgencyA,
    });
    assert.equal(crossTenantRead, null, "token cannot read outside tenant scope");

    const crossPartnerWrite = await updateActivePartnerTokenFormConfig({
      db,
      tenantId: tenantA,
      partnerAgencyId: partnerAgencyB,
      config: validated.value,
    });
    assert.equal(crossPartnerWrite, null, "admin cannot write outside partner scope");

    const partnerApp = buildPartnerApp();
    await partnerApp.ready();

    const partnerConfigResponse = await partnerApp.inject({
      method: "GET",
      url: "/v1/partner/form-config",
      headers: {
        host: hostA,
        [PARTNER_TOKEN_HEADER]: partnerTokenA,
      },
    });
    assert.equal(partnerConfigResponse.statusCode, 200);
    const partnerConfigBody = parseJson(partnerConfigResponse.body) as {
      success: boolean;
      data?: { intro_text?: string; rules_list?: string[]; allowed_voucher_types?: string[] };
      reason?: string;
    };
    assert.equal(partnerConfigBody.success, true);
    assert.deepStrictEqual(partnerConfigBody.data?.allowed_voucher_types, ["furniture", "clothing"]);

    const partnerRefusalResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host: hostA,
        "content-type": "application/json",
        [PARTNER_TOKEN_HEADER]: partnerTokenA,
      },
      payload: {
        voucher_type: "coats",
        first_name: "Partner",
        last_name: "Denied",
        date_of_birth: "1990-02-10",
        household_adults: 1,
        household_children: 0,
      },
    });
    assert.equal(partnerRefusalResponse.statusCode, 200);
    const partnerRefusalBody = parseJson(partnerRefusalResponse.body) as {
      success: boolean;
      reason?: string;
      correlation_id?: string;
    };
    assert.equal(partnerRefusalBody.success, false);
    assert.equal(partnerRefusalBody.reason, refusalReasons.notAuthorizedForAction);
    assert.equal(typeof partnerRefusalBody.correlation_id, "string");
    assert.equal(
      partnerRefusalResponse.headers["x-correlation-id"],
      partnerRefusalBody.correlation_id,
    );

    const tenantMismatchResponse = await partnerApp.inject({
      method: "GET",
      url: "/v1/partner/form-config",
      headers: {
        host: hostB,
        [PARTNER_TOKEN_HEADER]: partnerTokenA,
      },
    });
    assert.equal(tenantMismatchResponse.statusCode, 200);
    const tenantMismatchBody = parseJson(tenantMismatchResponse.body) as {
      success: boolean;
      reason?: string;
      correlation_id?: string;
    };
    assert.equal(tenantMismatchBody.success, false);
    assert.equal(tenantMismatchBody.reason, refusalReasons.tenantContextMismatch);
    assert.equal(typeof tenantMismatchBody.correlation_id, "string");

    const storeAdminApp = buildStoreAdminApp({
      actorId: storeAdminActorId,
      tenantId: tenantA,
    });
    await storeAdminApp.ready();

    const adminGetResponse = await storeAdminApp.inject({
      method: "GET",
      url: `/v1/store-admin/partners/${partnerAgencyA}/form-config`,
      headers: { host: hostA },
    });
    assert.equal(adminGetResponse.statusCode, 200);
    const adminGetBody = parseJson(adminGetResponse.body) as {
      success: boolean;
      data?: { intro_text?: string; rules_list?: string[]; allowed_voucher_types?: string[] };
    };
    assert.equal(adminGetBody.success, true);
    assert.deepStrictEqual(adminGetBody.data?.allowed_voucher_types, ["furniture", "clothing"]);

    const adminTenantMismatchResponse = await storeAdminApp.inject({
      method: "GET",
      url: `/v1/store-admin/partners/${partnerAgencyA}/form-config`,
      headers: { host: hostB },
    });
    assert.equal(adminTenantMismatchResponse.statusCode, 200);
    const adminTenantMismatchBody = parseJson(adminTenantMismatchResponse.body) as {
      success: boolean;
      reason?: string;
      correlation_id?: string;
    };
    assert.equal(adminTenantMismatchBody.success, false);
    assert.equal(adminTenantMismatchBody.reason, refusalReasons.tenantContextMismatch);
    assert.equal(typeof adminTenantMismatchBody.correlation_id, "string");

    const invalidAdminResponse = await storeAdminApp.inject({
      method: "PUT",
      url: `/v1/store-admin/partners/${partnerAgencyA}/form-config`,
      headers: { host: hostA, "content-type": "application/json" },
      payload: {
        allowed_voucher_types: ["clothing"],
        intro_text: "a".repeat(PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength + 1),
        rules_list: [],
      },
    });
    assert.equal(invalidAdminResponse.statusCode, 400);
    const invalidAdminBody = parseJson(invalidAdminResponse.body) as {
      success: boolean;
      error?: { code?: string };
      correlation_id?: string;
    };
    assert.equal(invalidAdminBody.success, false);
    assert.equal(invalidAdminBody.error?.code, "FST_ERR_VALIDATION");
    assert.equal(typeof invalidAdminBody.correlation_id, "string");

    const updatedPayload = {
      allowed_voucher_types: ["clothing"],
      intro_text: "Updated intro",
      rules_list: ["Bring ID"],
    };
    const adminPutResponse = await storeAdminApp.inject({
      method: "PUT",
      url: `/v1/store-admin/partners/${partnerAgencyA}/form-config`,
      headers: { host: hostA, "content-type": "application/json" },
      payload: updatedPayload,
    });
    assert.equal(adminPutResponse.statusCode, 200);
    const adminPutBody = parseJson(adminPutResponse.body) as {
      success: boolean;
      data?: { intro_text?: string; rules_list?: string[]; allowed_voucher_types?: string[] };
    };
    assert.equal(adminPutBody.success, true);
    assert.deepStrictEqual(adminPutBody.data?.allowed_voucher_types, ["clothing"]);
    assert.equal(adminPutBody.data?.intro_text, "Updated intro");
    assert.deepStrictEqual(adminPutBody.data?.rules_list, ["Bring ID"]);

    const partnerConfigUpdatedResponse = await partnerApp.inject({
      method: "GET",
      url: "/v1/partner/form-config",
      headers: {
        host: hostA,
        [PARTNER_TOKEN_HEADER]: partnerTokenASecondary,
      },
    });
    assert.equal(partnerConfigUpdatedResponse.statusCode, 200);
    const partnerConfigUpdatedBody = parseJson(partnerConfigUpdatedResponse.body) as {
      success: boolean;
      data?: { intro_text?: string; rules_list?: string[]; allowed_voucher_types?: string[] };
    };
    assert.equal(partnerConfigUpdatedBody.success, true);
    assert.deepStrictEqual(partnerConfigUpdatedBody.data?.allowed_voucher_types, ["clothing"]);
    assert.equal(partnerConfigUpdatedBody.data?.intro_text, "Updated intro");
    assert.deepStrictEqual(partnerConfigUpdatedBody.data?.rules_list, ["Bring ID"]);

    const partnerIssueSuccessResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host: hostA,
        "content-type": "application/json",
        [PARTNER_TOKEN_HEADER]: partnerTokenASecondary,
      },
      payload: {
        voucher_type: "clothing",
        first_name: "Partner",
        last_name: "Allowed",
        date_of_birth: "1992-04-16",
        household_adults: 1,
        household_children: 2,
      },
    });
    assert.equal(partnerIssueSuccessResponse.statusCode, 200);
    const partnerIssueSuccessBody = parseJson(partnerIssueSuccessResponse.body) as {
      success: boolean;
      data?: {
        voucher_id?: string;
        status?: string;
        voucher_type?: string;
      };
      correlation_id?: string;
    };
    assert.equal(partnerIssueSuccessBody.success, true);
    assert.equal(partnerIssueSuccessBody.data?.status, "active");
    assert.equal(partnerIssueSuccessBody.data?.voucher_type, "clothing");
    assert.equal(typeof partnerIssueSuccessBody.data?.voucher_id, "string");
    assert.equal(typeof partnerIssueSuccessBody.correlation_id, "string");

    const partnerLookupResponse = await partnerApp.inject({
      method: "GET",
      url: `/v1/vouchers/lookup?voucher_id=${partnerIssueSuccessBody.data?.voucher_id ?? ""}`,
      headers: {
        host: hostA,
        [PARTNER_TOKEN_HEADER]: partnerTokenASecondary,
      },
    });
    assert.equal(partnerLookupResponse.statusCode, 200);
    const partnerLookupBody = parseJson(partnerLookupResponse.body) as {
      success: boolean;
      data?: {
        voucher_id?: string;
        status?: string;
      };
    };
    assert.equal(partnerLookupBody.success, true);
    assert.equal(partnerLookupBody.data?.voucher_id, partnerIssueSuccessBody.data?.voucher_id);
    assert.equal(partnerLookupBody.data?.status, "active");

    await storeAdminApp.close();
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
