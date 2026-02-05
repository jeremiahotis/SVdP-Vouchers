import type { Knex } from "knex";
import { resolveTenantIdByHost as resolveFromPlatform } from "../platform/tenants.js";

export async function resolveTenantIdByHost(
  host: string,
  dbOverride?: Knex,
): Promise<string | null> {
  return resolveFromPlatform(host, dbOverride);
}
