import assert from "node:assert/strict";
import Fastify from "fastify";
import type { Knex } from "knex";
import { registerRoutes } from "../../apps/api/src/routes";
import { registerAdminRoutes } from "../../apps/api/src/admin/routes";
import { registerCorrelation } from "../../apps/api/src/observability/correlation";
import { closeDb, getDb } from "../../apps/api/src/db/client";
import { dbErrorHook, dbRequestHook, dbResponseHook } from "../../apps/api/src/db/hooks";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";
import { APP_KEY } from "../../apps/api/src/config/app";

const ACTOR_ID = "actor_audit";
const TENANT_ID = "00000000-0000-0000-0000-00000000a014";
const TENANT_HOST = "audit.local";

async function withTimeout<T>(label: string, promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

function buildAdminApp() {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", (request, _reply, done) => {
    request.authContext = {
      actorId: ACTOR_ID,
      tenantId: TENANT_ID,
      roles: ["platform_admin"],
    };
    done();
  });
  registerAdminRoutes(app);
  return app;
}

function buildTenantApp() {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  app.addHook("onRequest", (request, _reply, done) => {
    request.authContext = {
      actorId: ACTOR_ID,
      tenantId: TENANT_ID,
      roles: ["platform_admin"],
    };
    done();
  });
  app.addHook("onRequest", tenantContextHook);
  registerRoutes(app);
  return app;
}

async function seedBase(db: Knex) {
  await db("audit_events").del();
  await db.raw("DROP TRIGGER IF EXISTS audit_fail_trigger ON audit_events;");
  await db.raw("DROP FUNCTION IF EXISTS audit_fail();");
  const hostTenants = await db("platform.tenants")
    .where({ host: TENANT_HOST })
    .select("tenant_id");
  const hostTenantIds = hostTenants.map((row) => row.tenant_id as string);
  if (hostTenantIds.length > 0) {
    await db("platform.tenant_apps").whereIn("tenant_id", hostTenantIds).del();
    await db("platform.tenants").whereIn("tenant_id", hostTenantIds).del();
  }
  await db("platform.tenant_apps").where({ tenant_id: TENANT_ID }).del();
  await db("platform.tenants").where({ tenant_id: TENANT_ID }).del();
}

async function testAdminActionAuditEvent(db: Knex) {
  const app = buildAdminApp();
  await app.ready();

  const response = await withTimeout(
    "admin tenant create",
    app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { "content-type": "application/json" },
      payload: {
        tenant_id: TENANT_ID,
        host: TENANT_HOST,
      },
    }),
    8000,
  );

  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body) as {
    success: boolean;
    data: { tenant_id: string };
    correlation_id: string;
  };
  assert.equal(body.success, true);
  assert.equal(body.data.tenant_id, TENANT_ID);
  assert.ok(body.correlation_id);

  const event = await db("audit_events")
    .where({ tenant_id: TENANT_ID, event_type: "platform.tenant.created" })
    .orderBy("created_at", "desc")
    .first();

  assert.ok(event, "expected audit event for admin tenant creation");
  assert.ok(event.id, "expected audit event_id");
  assert.equal(event.actor_id, ACTOR_ID);
  assert.equal(event.tenant_id, TENANT_ID);
  assert.ok(event.created_at, "expected audit timestamp");
  assert.equal(event.reason ?? null, null);
  assert.ok(event.correlation_id, "expected audit correlation_id");

  await app.close();
}

async function testTenantRefusalAuditEvent(db: Knex) {
  const app = buildTenantApp();
  await app.ready();

  const response = await withTimeout(
    "tenant refusal",
    app.inject({
      method: "GET",
      url: "/me",
      headers: {
        host: "missing.local",
      },
    }),
    8000,
  );

  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body) as {
    success: boolean;
    reason?: string;
    correlation_id: string;
  };
  assert.equal(body.success, false);
  assert.equal(body.reason, "TENANT_NOT_FOUND");
  assert.ok(body.correlation_id);

  const event = await db("audit_events")
    .where({ reason: "TENANT_NOT_FOUND" })
    .orderBy("created_at", "desc")
    .first();

  assert.ok(event, "expected audit event for refusal outcome");
  assert.ok(event.id, "expected audit event_id");
  assert.equal(event.actor_id, ACTOR_ID);
  assert.ok(event.created_at, "expected audit timestamp");
  assert.ok(event.correlation_id, "expected audit correlation_id");

  await app.close();
}

async function testAppDisabledRefusalAuditEvent(db: Knex) {
  await db("platform.tenants")
    .insert({
      tenant_id: TENANT_ID,
      host: TENANT_HOST,
      tenant_slug: "audit",
      status: "active",
    })
    .onConflict("tenant_id")
    .merge({ host: TENANT_HOST, status: "active", updated_at: db.fn.now() });

  await db("platform.tenant_apps")
    .insert({
      tenant_id: TENANT_ID,
      app_key: APP_KEY,
      enabled: false,
    })
    .onConflict(["tenant_id", "app_key"])
    .merge({ enabled: false, updated_at: db.fn.now() });

  const app = buildTenantApp();
  await app.ready();

  const response = await withTimeout(
    "app disabled refusal",
    app.inject({
      method: "GET",
      url: "/me",
      headers: {
        host: TENANT_HOST,
      },
    }),
    8000,
  );

  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body) as {
    success: boolean;
    reason?: string;
    correlation_id: string;
  };
  assert.equal(body.success, false);
  assert.equal(body.reason, "TENANT_NOT_FOUND");
  assert.ok(body.correlation_id);

  const event = await db("audit_events")
    .where({ tenant_id: TENANT_ID })
    .orderBy("created_at", "desc")
    .first();

  assert.ok(event, "expected audit event for app-disabled refusal");
  assert.ok(event.id, "expected audit event_id");
  assert.equal(event.tenant_id, TENANT_ID);
  assert.ok(event.created_at, "expected audit timestamp");
  assert.ok(event.correlation_id, "expected audit correlation_id");
  assert.ok(event.reason, "expected audit reason");

  await app.close();
}

async function testAdminAuditFailureReturnsError(db: Knex) {
  // Create tenant first so tenant_apps insert doesn't fail on FK constraint
  await db("platform.tenants")
    .insert({
      tenant_id: TENANT_ID,
      host: TENANT_HOST,
      tenant_slug: "audit",
      status: "active",
    })
    .onConflict("tenant_id")
    .merge({ host: TENANT_HOST, status: "active", updated_at: db.fn.now() });

  await db.raw(`
    CREATE OR REPLACE FUNCTION audit_fail() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit insert failed';
    END;
    $$ LANGUAGE plpgsql;
  `);
  await db.raw(`
    CREATE TRIGGER audit_fail_trigger
    BEFORE INSERT ON audit_events
    FOR EACH ROW EXECUTE FUNCTION audit_fail();
  `);

  const app = buildAdminApp();
  await app.ready();

  const response = await withTimeout(
    "admin audit failure",
    app.inject({
      method: "POST",
      url: "/admin/tenant-apps",
      headers: { "content-type": "application/json" },
      payload: {
        tenant_id: TENANT_ID,
        app_key: "voucher_shyft",
        enabled: true,
      },
    }),
    8000,
  );

  assert.equal(response.statusCode, 500);
  const body = JSON.parse(response.body) as {
    success: boolean;
    error?: { code?: string; message?: string };
    correlation_id?: string;
  };
  assert.equal(body.success, false);
  assert.equal(body.error?.code, "AUDIT_WRITE_FAILED");
  assert.ok(body.correlation_id);

  await app.close();

  await db.raw("DROP TRIGGER IF EXISTS audit_fail_trigger ON audit_events;");
  await db.raw("DROP FUNCTION IF EXISTS audit_fail();");
}

async function run() {
  const db = getDb();

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });
    await seedBase(db);
    await testAdminActionAuditEvent(db);
    await seedBase(db);
    await testTenantRefusalAuditEvent(db);
    await seedBase(db);
    await testAppDisabledRefusalAuditEvent(db);
    await seedBase(db);
    await testAdminAuditFailureReturnsError(db);
  } finally {
    await seedBase(db);
    await closeDb();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
