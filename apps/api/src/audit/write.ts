import type { Knex } from "knex";
import { randomUUID } from "crypto";
import { getDb } from "../db/client.js";

export async function writeAuditEvent(params: {
  tenantId: string | null;
  actorId: string;
  eventType: string;
  entityId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  partnerAgencyId?: string | null;
  correlationId?: string | null;
  dbOverride?: Knex;
}) {
  const db = params.dbOverride ?? getDb();
  await db("audit_events").insert({
    id: randomUUID(),
    tenant_id: params.tenantId,
    actor_id: params.actorId,
    event_type: params.eventType,
    entity_id: params.entityId ?? null,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
    partner_agency_id: params.partnerAgencyId ?? null,
    correlation_id: params.correlationId ?? null,
  });
}
