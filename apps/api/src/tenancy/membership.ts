import type { Knex } from "knex";
import { getDb } from "../db/client.js";

export async function isMember(
  tenantId: string,
  actorId: string,
  dbOverride?: Knex,
): Promise<boolean> {
  const connection = dbOverride ?? getDb();
  const row = await connection("memberships")
    .select("id")
    .where({ tenant_id: tenantId, actor_id: actorId })
    .first();

  return Boolean(row);
}
