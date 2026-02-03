import { getDb } from "../db/client";

export async function writeAuditEvent(params: {
  tenantId: string | null;
  actorId: string;
  eventType: string;
  entityId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await getDb()("audit_events").insert({
    id: params.entityId ?? null,
    tenant_id: params.tenantId,
    actor_id: params.actorId,
    event_type: params.eventType,
    entity_id: params.entityId ?? null,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
  });
}
