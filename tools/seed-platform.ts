import knex from "knex";
import config from "../apps/api/db/knexfile";
import { APP_KEY } from "../apps/api/src/config/app";

if (process.env.ALLOW_PLATFORM_SEED !== "true") {
  console.error("Seed aborted: set ALLOW_PLATFORM_SEED=true to run.");
  process.exit(1);
}

const db = knex(config);

const tenantId = process.env.SEED_TENANT_ID ?? "tenant_001";
const host = process.env.SEED_TENANT_HOST ?? "store-a.voucher.shyft.org";
const slug = process.env.SEED_TENANT_SLUG ?? "store-a";

const actorId = process.env.SEED_ACTOR_ID ?? "platform_admin_seed";
const adminActorId = process.env.SEED_ADMIN_ACTOR_ID ?? actorId;

await db("platform.tenants")
  .insert({
    tenant_id: tenantId,
    host,
    tenant_slug: slug,
    status: "active",
  })
  .onConflict("tenant_id")
  .merge({ host, tenant_slug: slug, status: "active", updated_at: db.fn.now() });

await db("platform.tenant_apps")
  .insert({
    tenant_id: tenantId,
    app_key: APP_KEY,
    enabled: true,
  })
  .onConflict(["tenant_id", "app_key"])
  .merge({ enabled: true, updated_at: db.fn.now() });

await db("memberships")
  .insert({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    actor_id: adminActorId,
    role: "platform_admin",
  })
  .onConflict(["tenant_id", "actor_id", "role"])
  .ignore();

await db("audit_events").insert({
  tenant_id: tenantId,
  actor_id: actorId,
  event_type: "platform.seed",
  entity_id: tenantId,
  metadata: { host, app_key: APP_KEY, admin_actor_id: adminActorId },
});

await db.destroy();

console.log("Seed complete for tenant:", tenantId);
