import { resolveTenantIdByHost as resolveFromPlatform } from "../platform/tenants.js";

export async function resolveTenantIdByHost(host: string): Promise<string | null> {
  return resolveFromPlatform(host);
}
