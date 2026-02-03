import { resolveTenantByHost as resolveFromRegistry } from "./registry";

export async function resolveTenantIdByHost(host: string): Promise<string | null> {
  const tenant = await resolveFromRegistry(host);
  return tenant?.tenant_id ?? null;
}
