import { resolveTenantIdByHost as resolveFromPlatform } from "../platform/tenants";

export async function resolveTenantIdByHost(host: string): Promise<string | null> {
  return resolveFromPlatform(host);
}
