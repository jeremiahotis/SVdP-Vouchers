import assert from "node:assert/strict";
import knex, { type Knex } from "knex";
import config from "../../apps/api/db/knexfile";
import { APP_KEY } from "../../apps/api/src/config/app";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";
import { closeDb } from "../../apps/api/src/db/client";
import { refusalReasons } from "../../apps/api/src/tenancy/refusal";
import { REFUSAL_REASONS } from "../../packages/contracts/src/constants/refusal-reasons";
import { createMembership, createTenant, createTenantApp } from "../support/fixtures/factories/tenant-factory";
import { faker } from "@faker-js/faker";
import type { FastifyReply, FastifyRequest } from "fastify";

type TestAuthContext = {
  actorId: string;
  tenantId: string;
  roles: string[];
};

type ReplyCapture = FastifyReply & {
  statusCode?: number;
  body?: unknown;
};

type RequestCapture = FastifyRequest & {
  authContext?: TestAuthContext;
  tenantContext?: { tenantId: string; host: string };
};

function createReply(): ReplyCapture {
  return {
    statusCode: undefined,
    body: undefined,
    code(status: number) {
      this.statusCode = status;
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
  authContext?: TestAuthContext;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  db?: Knex;
}): RequestCapture {
  return {
    id: faker.string.uuid(),
    url: "/me",
    headers: { host: params.host },
    authContext: params.authContext,
    query: params.query,
    body: params.body,
    db: params.db,
  } as RequestCapture;
}

function normalizeRefusal(body: unknown) {
  const payload = body as { success?: boolean; reason?: string; correlation_id?: string };
  return {
    success: payload?.success,
    reason: payload?.reason,
    correlation_id: payload?.correlation_id ? "<correlation_id>" : null,
  };
}

async function run() {
  const db = knex(config);
  const createdTenants: string[] = [];
  const createdMemberships: string[] = [];

  const cleanup = async () => {
    if (createdMemberships.length > 0) {
      await db("memberships").whereIn("id", createdMemberships).delete();
    }
    if (createdTenants.length > 0) {
      await db("platform.tenant_apps").whereIn("tenant_id", createdTenants).delete();
      await db("platform.tenants").whereIn("tenant_id", createdTenants).delete();
    }
  };

  try {
    // AC5: unknown host refusal shape matches disabled-app refusal.
    const disabledTenant = createTenant();
    const disabledApp = createTenantApp({
      tenant_id: disabledTenant.tenant_id,
      app_key: APP_KEY,
      enabled: false,
    });

    await db("platform.tenants")
      .insert(disabledTenant)
      .onConflict("tenant_id")
      .merge({ host: disabledTenant.host, status: "active", updated_at: db.fn.now() });
    createdTenants.push(disabledTenant.tenant_id);

    await db("platform.tenant_apps")
      .insert(disabledApp)
      .onConflict(["tenant_id", "app_key"])
      .merge({ enabled: false, updated_at: db.fn.now() });

    const unknownRequest = createRequest({
      host: "unknown.voucher.shyft.org",
      db,
    });
    const unknownReply = createReply();
    await tenantContextHook(unknownRequest, unknownReply);

    const disabledRequest = createRequest({ host: disabledTenant.host, db });
    const disabledReply = createReply();
    await tenantContextHook(disabledRequest, disabledReply);

    assert.equal(unknownReply.statusCode, 200);
    assert.equal(disabledReply.statusCode, 200);
    assert.deepStrictEqual(normalizeRefusal(unknownReply.body), normalizeRefusal(disabledReply.body));

    // AC3: host/JWT mismatch returns TENANT_CONTEXT_MISMATCH.
    const mismatchTenant = createTenant();
    const mismatchApp = createTenantApp({
      tenant_id: mismatchTenant.tenant_id,
      app_key: APP_KEY,
      enabled: true,
    });

    await db("platform.tenants")
      .insert(mismatchTenant)
      .onConflict("tenant_id")
      .merge({ host: mismatchTenant.host, status: "active", updated_at: db.fn.now() });
    createdTenants.push(mismatchTenant.tenant_id);

    await db("platform.tenant_apps")
      .insert(mismatchApp)
      .onConflict(["tenant_id", "app_key"])
      .merge({ enabled: true, updated_at: db.fn.now() });

    const mismatchRequest = createRequest({
      host: mismatchTenant.host,
      db,
      authContext: {
        actorId: faker.string.uuid(),
        tenantId: faker.string.uuid(),
        roles: ["platform_admin"],
      },
    });
    const mismatchReply = createReply();
    await tenantContextHook(mismatchRequest, mismatchReply);

    assert.equal(mismatchReply.statusCode, 200);
    assert.equal(
      (mismatchReply.body as { reason?: string })?.reason,
      REFUSAL_REASONS.tenantContextMismatch,
    );

    // Reject tenant_id provided via query/body.
    const queryTenantRequest = createRequest({
      host: mismatchTenant.host,
      db,
      authContext: {
        actorId: faker.string.uuid(),
        tenantId: mismatchTenant.tenant_id,
        roles: ["platform_admin"],
      },
      query: { tenant_id: mismatchTenant.tenant_id },
    });
    const queryTenantReply = createReply();
    await tenantContextHook(queryTenantRequest, queryTenantReply);

    assert.equal(queryTenantReply.statusCode, 200);
    assert.equal(
      (queryTenantReply.body as { reason?: string })?.reason,
      REFUSAL_REASONS.tenantContextMismatch,
    );

    const bodyTenantRequest = createRequest({
      host: mismatchTenant.host,
      db,
      authContext: {
        actorId: faker.string.uuid(),
        tenantId: mismatchTenant.tenant_id,
        roles: ["platform_admin"],
      },
      body: { tenant_id: mismatchTenant.tenant_id },
    });
    const bodyTenantReply = createReply();
    await tenantContextHook(bodyTenantRequest, bodyTenantReply);

    assert.equal(bodyTenantReply.statusCode, 200);
    assert.equal(
      (bodyTenantReply.body as { reason?: string })?.reason,
      REFUSAL_REASONS.tenantContextMismatch,
    );

    // AC4: non-membership returns NOT_A_MEMBER (expected to fail until implemented).
    const memberTenant = createTenant();
    const memberApp = createTenantApp({
      tenant_id: memberTenant.tenant_id,
      app_key: APP_KEY,
      enabled: true,
    });
    const memberActorId = faker.string.uuid();

    await db("platform.tenants")
      .insert(memberTenant)
      .onConflict("tenant_id")
      .merge({ host: memberTenant.host, status: "active", updated_at: db.fn.now() });
    createdTenants.push(memberTenant.tenant_id);

    await db("platform.tenant_apps")
      .insert(memberApp)
      .onConflict(["tenant_id", "app_key"])
      .merge({ enabled: true, updated_at: db.fn.now() });

    const nonMemberRequest = createRequest({
      host: memberTenant.host,
      db,
      authContext: {
        actorId: memberActorId,
        tenantId: memberTenant.tenant_id,
        roles: ["platform_admin"],
      },
    });
    const nonMemberReply = createReply();
    await tenantContextHook(nonMemberRequest, nonMemberReply);

    assert.equal(nonMemberReply.statusCode, 200);
    assert.equal(
      (nonMemberReply.body as { reason?: string })?.reason,
      "NOT_A_MEMBER",
    );

    // Membership present should allow tenant context.
    const membership = createMembership({
      tenant_id: memberTenant.tenant_id,
      actor_id: memberActorId,
      role: "steward",
    });
    await db("memberships").insert(membership);
    createdMemberships.push(membership.id);

    const memberRequest = createRequest({
      host: memberTenant.host,
      db,
      authContext: {
        actorId: memberActorId,
        tenantId: memberTenant.tenant_id,
        roles: ["platform_admin"],
      },
    });

    // AC1: missing authContext returns TENANT_CONTEXT_MISMATCH.
    const missingAuthRequest = createRequest({
      host: memberTenant.host,
      db,
    });
    const missingAuthReply = createReply();
    await tenantContextHook(missingAuthRequest, missingAuthReply);
    assert.equal(missingAuthReply.statusCode, 200);
    assert.equal(
      (missingAuthReply.body as { reason?: string })?.reason,
      REFUSAL_REASONS.tenantContextMismatch,
    );

    // AC1: missing tenantId claim returns TENANT_CONTEXT_MISMATCH.
    const missingClaimRequest = createRequest({
      host: memberTenant.host,
      db,
      authContext: {
        actorId: memberActorId,
        tenantId: "" as string,
        roles: ["platform_admin"],
      },
    });
    const missingClaimReply = createReply();
    await tenantContextHook(missingClaimRequest, missingClaimReply);
    assert.equal(missingClaimReply.statusCode, 200);
    assert.equal(
      (missingClaimReply.body as { reason?: string })?.reason,
      REFUSAL_REASONS.tenantContextMismatch,
    );
    const memberReply = createReply();
    await tenantContextHook(memberRequest, memberReply);

    assert.equal(memberReply.statusCode, undefined);
    assert.equal(memberRequest.tenantContext?.tenantId, memberTenant.tenant_id);

    // Refusal reason registry includes NOT_A_MEMBER (expected to fail until implemented).
    assert.equal(
      (REFUSAL_REASONS as Record<string, string>).notAMember,
      "NOT_A_MEMBER",
    );
    assert.equal(
      (refusalReasons as Record<string, string>).notAMember,
      "NOT_A_MEMBER",
    );
  } finally {
    await cleanup();
    await db.destroy();
    await closeDb();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
