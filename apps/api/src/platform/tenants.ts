import type { Knex } from "knex";
import { resolveTenantByHost as resolveFromRegistry } from "./registry.js";

export async function resolveTenantIdByHost(
  host: string,
  dbOverride?: Knex,
): Promise<string | null> {
  const tenant = await resolveFromRegistry(host, dbOverride);
  return tenant?.tenant_id ?? null;
}
