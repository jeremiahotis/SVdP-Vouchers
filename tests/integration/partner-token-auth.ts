import assert from "node:assert/strict";
import knex, { type Knex } from "knex";
import { faker } from "@faker-js/faker";
import config from "../../apps/api/db/knexfile";
import { authHook } from "../../apps/api/src/auth/hook";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";
import { PARTNER_TOKEN_HEADER, hashPartnerToken } from "../../apps/api/src/auth/partner-token";
import { REFUSAL_REASONS } from "../../packages/contracts/src/constants/refusal-reasons";
import type { FastifyReply, FastifyRequest } from "fastify";
import { APP_KEY } from "../../apps/api/src/config/app";

type ReplyCapture = FastifyReply & {
  statusCode?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

type RequestCapture = FastifyRequest & {
  db?: Knex;
  tenantContext?: { tenantId: string; host: string };
  partnerContext?: { tokenId: string; tenantId: string; partnerAgencyId: string };
};

function createReply(): ReplyCapture {
  return {
    statusCode: undefined,
    body: undefined,
    headers: {},
    code(status: number) {
      this.statusCode = status;
      return this;
    },
    header(name: string, value: string) {
      this.headers = this.headers ?? {};
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as ReplyCapture;
}

function createRequest(params: {
  host: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  db: Knex;
}): RequestCapture {
  return {
    id: faker.string.uuid(),
    url: params.url,
    method: params.method,
    headers: { host: params.host, ...(params.headers ?? {}) },
    db: params.db,
    query: {},
    body: {},
  } as RequestCapture;
}

function parsePayload(body: unknown) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  }
  return (body ?? {}) as Record<string, unknown>;
}

function parseRefusal(body: unknown) {
  return parsePayload(body) as { reason?: string };
}

async function seedTenant(db: Knex, tenantId: string, host: string) {
  await db("platform.tenants")
    .insert({ tenant_id: tenantId, host, tenant_slug: "partner", status: "active" })
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
  const partnerAgencyId = faker.string.uuid();
  const partnerTokenId = faker.string.uuid();
  const partnerToken = "partner-token-secret";
  const partnerTokenHash = hashPartnerToken(partnerToken);

  const cleanup: Array<() => Promise<void>> = [];

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });
    await seedTenant(db, tenantId, host);
    cleanup.push(async () => {
      await db("platform.tenant_apps").where({ tenant_id: tenantId }).del();
      await db("platform.tenants").where({ tenant_id: tenantId }).del();
    });

    await db("partner_agencies").insert({
      id: partnerAgencyId,
      tenant_id: tenantId,
      name: "Partner Agency",
      status: "active",
    });
    cleanup.push(async () => {
      await db("partner_agencies").where({ id: partnerAgencyId }).del();
    });

    await db("partner_tokens").insert({
      id: partnerTokenId,
      tenant_id: tenantId,
      partner_agency_id: partnerAgencyId,
      token_hash: partnerTokenHash,
      status: "active",
      form_config: {},
    });
    cleanup.push(async () => {
      await db("partner_tokens").where({ id: partnerTokenId }).del();
    });

    const allowedRequest = createRequest({
      host,
      url: "/v1/vouchers",
      method: "POST",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const allowedReply = createReply();
    await authHook(allowedRequest, allowedReply);
    await tenantContextHook(allowedRequest, allowedReply);

    assert.equal(allowedReply.statusCode, undefined);
    assert.equal(allowedRequest.partnerContext?.tenantId, tenantId);
    assert.equal(allowedRequest.partnerContext?.partnerAgencyId, partnerAgencyId);
    assert.equal(allowedRequest.tenantContext?.tenantId, tenantId);
    const issuanceAudit = await db("audit_events")
      .where({
        event_type: "partner.issuance.request",
        tenant_id: tenantId,
        partner_agency_id: partnerAgencyId,
        correlation_id: allowedRequest.id,
      })
      .first();
    assert.ok(issuanceAudit, "partner issuance audit event should include partner_agency_id");

    const invalidRequest = createRequest({
      host,
      url: "/v1/vouchers",
      method: "POST",
      headers: { [PARTNER_TOKEN_HEADER]: "bad-token" },
      db,
    });
    const invalidReply = createReply();
    assert.equal(
      (invalidRequest.headers as Record<string, string>)[PARTNER_TOKEN_HEADER],
      "bad-token",
    );
    await authHook(invalidRequest, invalidReply);

    assert.equal(invalidReply.statusCode, 200);
    assert.equal(parseRefusal(invalidReply.body).reason, REFUSAL_REASONS.partnerTokenInvalid);

    const disallowedRequest = createRequest({
      host,
      url: "/me",
      method: "GET",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const disallowedReply = createReply();
    await authHook(disallowedRequest, disallowedReply);
    await tenantContextHook(disallowedRequest, disallowedReply);

    assert.equal(disallowedReply.statusCode, 200);
    assert.equal(parseRefusal(disallowedReply.body).reason, REFUSAL_REASONS.partnerTokenScope);

    const adminRequest = createRequest({
      host,
      url: "/admin/tenants",
      method: "GET",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const adminReply = createReply();
    await authHook(adminRequest, adminReply);
    await tenantContextHook(adminRequest, adminReply);

    assert.equal(adminReply.statusCode, 200);
    assert.equal(parseRefusal(adminReply.body).reason, REFUSAL_REASONS.partnerTokenScope);

    const otherPartnerId = faker.string.uuid();
    await db("partner_agencies").insert({
      id: otherPartnerId,
      tenant_id: tenantId,
      name: "Other Partner",
      status: "active",
    });
    cleanup.push(async () => {
      await db("partner_agencies").where({ id: otherPartnerId }).del();
    });

    const voucherId = faker.string.uuid();
    await db("vouchers").insert({
      id: voucherId,
      tenant_id: tenantId,
      status: "active",
      partner_agency_id: otherPartnerId,
    });
    cleanup.push(async () => {
      await db("vouchers").where({ id: voucherId }).del();
    });

    const missingLookupRequest = createRequest({
      host,
      url: "/v1/vouchers/lookup",
      method: "GET",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const missingLookupReply = createReply();
    await authHook(missingLookupRequest, missingLookupReply);
    await tenantContextHook(missingLookupRequest, missingLookupReply);

    assert.equal(missingLookupReply.statusCode, 200);
    assert.equal(parseRefusal(missingLookupReply.body).reason, REFUSAL_REASONS.partnerTokenScope);

    const lookupRequest = createRequest({
      host,
      url: `/v1/vouchers/lookup?voucher_id=${voucherId}`,
      method: "GET",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const lookupReply = createReply();
    lookupRequest.query = { voucher_id: voucherId };
    await authHook(lookupRequest, lookupReply);
    await tenantContextHook(lookupRequest, lookupReply);

    assert.equal(lookupReply.statusCode, 200);
    assert.equal(parseRefusal(lookupReply.body).reason, REFUSAL_REASONS.partnerTokenScope);

    const allowedVoucherId = faker.string.uuid();
    await db("vouchers").insert({
      id: allowedVoucherId,
      tenant_id: tenantId,
      status: "active",
      partner_agency_id: partnerAgencyId,
    });
    cleanup.push(async () => {
      await db("vouchers").where({ id: allowedVoucherId }).del();
    });

    const allowedLookupRequest = createRequest({
      host,
      url: `/v1/vouchers/lookup?voucher_id=${allowedVoucherId}`,
      method: "GET",
      headers: { [PARTNER_TOKEN_HEADER]: partnerToken },
      db,
    });
    const allowedLookupReply = createReply();
    allowedLookupRequest.query = { voucher_id: allowedVoucherId };
    await authHook(allowedLookupRequest, allowedLookupReply);
    await tenantContextHook(allowedLookupRequest, allowedLookupReply);

    assert.equal(allowedLookupReply.statusCode, undefined);
    const lookupAudit = await db("audit_events")
      .where({
        event_type: "partner.lookup.request",
        tenant_id: tenantId,
        partner_agency_id: partnerAgencyId,
        entity_id: allowedVoucherId,
        correlation_id: allowedLookupRequest.id,
      })
      .first();
    assert.ok(lookupAudit, "partner lookup audit event should include partner_agency_id");

    const rateLimitTokenId = faker.string.uuid();
    const rateLimitToken = "rate-limit-token";
    const rateLimitTokenHash = hashPartnerToken(rateLimitToken);

    await db("partner_tokens").insert({
      id: rateLimitTokenId,
      tenant_id: tenantId,
      partner_agency_id: partnerAgencyId,
      token_hash: rateLimitTokenHash,
      status: "active",
      form_config: {},
    });
    cleanup.push(async () => {
      await db("partner_tokens").where({ id: rateLimitTokenId }).del();
    });

    for (let i = 0; i < 20; i += 1) {
      const rateLimitRequest = createRequest({
        host,
        url: "/v1/vouchers",
        method: "POST",
        headers: { [PARTNER_TOKEN_HEADER]: rateLimitToken },
        db,
      });
      const rateLimitReply = createReply();
      await authHook(rateLimitRequest, rateLimitReply);
      await tenantContextHook(rateLimitRequest, rateLimitReply);
      assert.equal(rateLimitReply.statusCode, undefined);
    }

    const limitExceededRequest = createRequest({
      host,
      url: "/v1/vouchers",
      method: "POST",
      headers: { [PARTNER_TOKEN_HEADER]: rateLimitToken },
      db,
    });
    const limitExceededReply = createReply();
    await authHook(limitExceededRequest, limitExceededReply);
    await tenantContextHook(limitExceededRequest, limitExceededReply);

    assert.equal(limitExceededReply.statusCode, 429);
    assert.ok(limitExceededReply.headers?.["retry-after"]);
    const limitPayload = parsePayload(limitExceededReply.body) as {
      error?: { code?: string };
    };
    assert.equal(limitPayload.error?.code, "RATE_LIMITED");
  } finally {
    for (const runCleanup of cleanup.reverse()) {
      await runCleanup();
    }
    await db.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
