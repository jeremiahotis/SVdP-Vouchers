import assert from "node:assert/strict";
import knex from "knex";
import config from "../../apps/api/db/knexfile";
import { resolveTenantByHost } from "../../apps/api/src/platform/registry";
import { isAppEnabled } from "../../apps/api/src/platform/registry";
import { APP_KEY } from "../../apps/api/src/config/app";

async function run() {
  const db = knex(config);

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    const tenantId = "tenant_test";
    const host = "test.voucher.shyft.org";

    await db("platform.tenants")
      .insert({ tenant_id: tenantId, host, tenant_slug: "test", status: "active" })
      .onConflict("tenant_id")
      .merge({ host, status: "active", updated_at: db.fn.now() });

    await db("platform.tenant_apps")
      .insert({ tenant_id: tenantId, app_key: APP_KEY, enabled: true })
      .onConflict(["tenant_id", "app_key"])
      .merge({ enabled: true, updated_at: db.fn.now() });
    const resolved = await resolveTenantByHost(host, db);
    assert.equal(resolved?.tenant_id, tenantId);

    const enabled = await isAppEnabled(tenantId, APP_KEY, db);
    assert.equal(enabled, true);
  } finally {
    await db.destroy();
  }

  // Diagnose any open handles that keep the process alive in test containers.
  if (process.env.DEBUG_TEST_HANDLES === "1") {
    const handles = (process as { _getActiveHandles?: () => unknown[] })._getActiveHandles?.() ?? [];
    const requests = (process as { _getActiveRequests?: () => unknown[] })._getActiveRequests?.() ?? [];
    const nonStdHandles = handles.filter((handle) => {
      const candidate = handle as { _isStdio?: boolean; fd?: number };
      return !candidate?._isStdio && candidate?.fd !== 1 && candidate?.fd !== 2;
    });
    if (nonStdHandles.length > 0 || requests.length > 0) {
      console.error("Active handles after db.destroy():", nonStdHandles);
      console.error("Active requests after db.destroy():", requests);
      process.exit(1);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
