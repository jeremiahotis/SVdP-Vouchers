import type { Knex } from "knex";
import { getDb } from "../db/client";

export type PlatformTenant = {
  tenant_id: string;
  host: string;
  tenant_slug: string | null;
  status: string;
};

export async function resolveTenantByHost(
  host: string,
  dbOverride?: Knex,
): Promise<PlatformTenant | null> {
  const connection = dbOverride ?? getDb();
  const row = await connection("platform.tenants")
    .select("tenant_id", "host", "tenant_slug", "status")
    .where({ host })
    .first();

  if (!row || row.status !== "active") {
    return null;
  }

  return row as PlatformTenant;
}

export async function isAppEnabled(
  tenantId: string,
  appKey: string,
  dbOverride?: Knex,
): Promise<boolean> {
  const connection = dbOverride ?? getDb();
  const row = await connection("platform.tenant_apps")
    .select("enabled")
    .where({ tenant_id: tenantId, app_key: appKey })
    .first();

  return Boolean(row?.enabled);
}
