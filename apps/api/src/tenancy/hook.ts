import type { FastifyReply, FastifyRequest } from "fastify";
import { APP_KEY } from "../config/app.js";
import { resolveTenantIdByHost } from "./resolve.js";
import { refusal, refusalReasons } from "./refusal.js";
import { isAppEnabled } from "../platform/registry.js";
import { isMember } from "./membership.js";
import { writeAuditEvent } from "../audit/write.js";

export async function tenantContextHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.url.startsWith("/health")) {
    return;
  }
  if (request.url.startsWith("/admin")) {
    return;
  }

  const hostHeader = request.headers.host ?? "";
  const host = hostHeader.split(":")[0];
  const correlationId = request.id;
  const actorId = request.authContext?.actorId ?? "anonymous";

  if (!host) {
    await writeAuditEvent({
      tenantId: null,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantNotFound,
      correlationId,
      dbOverride: request.db,
    });
    reply.code(200).header("content-type", "application/json").send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  const tenantId = await resolveTenantIdByHost(host, request.db);
  if (!tenantId) {
    await writeAuditEvent({
      tenantId: null,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantNotFound,
      correlationId,
      dbOverride: request.db,
    });
    reply.code(200).header("content-type", "application/json").send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  const enabled = await isAppEnabled(tenantId, APP_KEY, request.db);
  if (!enabled) {
    request.log.warn(
      {
        msg: "app_disabled",
        reason: "APP_DISABLED",
        tenant_id: tenantId,
        correlation_id: correlationId,
      },
      "app_disabled",
    );
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantNotFound,
      correlationId,
      dbOverride: request.db,
    });
    reply.code(200).header("content-type", "application/json").send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  if (!request.authContext || !request.authContext.tenantId) {
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantContextMismatch,
      correlationId,
      dbOverride: request.db,
    });
    reply
      .code(200)
      .header("content-type", "application/json")
      .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
    return;
  }

  const tenantClaim = request.authContext.tenantId;
  if (tenantClaim !== tenantId) {
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantContextMismatch,
      correlationId,
      dbOverride: request.db,
    });
    reply
      .code(200)
      .header("content-type", "application/json")
      .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
    return;
  }

  const queryTenantId = (request.query as { tenant_id?: string } | undefined)?.tenant_id;
  const bodyTenantId = (request.body as { tenant_id?: string } | undefined)?.tenant_id;
  if (queryTenantId || bodyTenantId) {
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantContextMismatch,
      correlationId,
      dbOverride: request.db,
    });
    reply
      .code(200)
      .header("content-type", "application/json")
      .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
    return;
  }

  const member = await isMember(tenantId, request.authContext.actorId, request.db);
  if (!member) {
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.notAMember,
      correlationId,
      dbOverride: request.db,
    });
    reply
      .code(200)
      .header("content-type", "application/json")
      .send(refusal(refusalReasons.notAMember, correlationId));
    return;
  }

  request.tenantContext = { tenantId, host };
}

