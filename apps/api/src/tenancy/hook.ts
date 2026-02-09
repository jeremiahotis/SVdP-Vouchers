import type { FastifyReply, FastifyRequest } from "fastify";
import { APP_KEY } from "../config/app.js";
import { resolveTenantIdByHost } from "./resolve.js";
import { refusal, refusalReasons } from "./refusal.js";
import { isAppEnabled } from "../platform/registry.js";
import { isMember } from "./membership.js";
import { writeAuditEvent } from "../audit/write.js";
import { checkPartnerTokenRateLimit } from "../rate-limit/partner-token.js";

function getRequestPath(request: FastifyRequest) {
  return request.url.split("?")[0] ?? request.url;
}

function isPartnerIssuanceRequest(request: FastifyRequest) {
  return request.method === "POST" && getRequestPath(request) === "/v1/vouchers";
}

function isPartnerLookupRequest(request: FastifyRequest) {
  return request.method === "GET" && getRequestPath(request) === "/v1/vouchers/lookup";
}

function isPartnerAllowedRequest(request: FastifyRequest) {
  return isPartnerIssuanceRequest(request) || isPartnerLookupRequest(request);
}

function getLookupVoucherId(request: FastifyRequest): string | null {
  const query = request.query as { voucher_id?: string; voucherId?: string; id?: string } | undefined;
  return query?.voucher_id ?? query?.voucherId ?? query?.id ?? null;
}

export async function tenantContextHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.url.startsWith("/health")) {
    return;
  }

  const correlationId = request.id;
  const actorId = request.authContext?.actorId ?? "anonymous";
  const partnerAgencyId = request.partnerContext?.partnerAgencyId ?? null;
  const partnerTenantId = request.partnerContext?.tenantId ?? null;

  if (request.url.startsWith("/admin")) {
    if (request.partnerContext) {
      await writeAuditEvent({
        tenantId: partnerTenantId,
        actorId,
        eventType: "tenancy.refusal",
        reason: refusalReasons.partnerTokenScope,
        partnerAgencyId,
        correlationId,
        dbOverride: request.db,
      });
      reply
        .code(200)
        .header("content-type", "application/json")
        .send(refusal(refusalReasons.partnerTokenScope, correlationId));
    }
    return;
  }

  const hostHeader = request.headers.host ?? "";
  const host = hostHeader.split(":")[0];

  if (!host) {
    await writeAuditEvent({
      tenantId: null,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantNotFound,
      partnerAgencyId,
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
      partnerAgencyId,
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
      partnerAgencyId,
      correlationId,
      dbOverride: request.db,
    });
    reply.code(200).header("content-type", "application/json").send(refusal(refusalReasons.tenantNotFound, correlationId));
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
      partnerAgencyId,
      correlationId,
      dbOverride: request.db,
    });
    reply
      .code(200)
      .header("content-type", "application/json")
      .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
    return;
  }

  if (request.partnerContext) {
    if (request.partnerContext.tenantId !== tenantId) {
      await writeAuditEvent({
        tenantId,
        actorId,
        eventType: "tenancy.refusal",
        reason: refusalReasons.tenantContextMismatch,
        partnerAgencyId,
        correlationId,
        dbOverride: request.db,
      });
      reply
        .code(200)
        .header("content-type", "application/json")
        .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
      return;
    }

    if (!isPartnerAllowedRequest(request)) {
      await writeAuditEvent({
        tenantId,
        actorId,
        eventType: "tenancy.refusal",
        reason: refusalReasons.partnerTokenScope,
        partnerAgencyId,
        correlationId,
        dbOverride: request.db,
      });
      reply
        .code(200)
        .header("content-type", "application/json")
        .send(refusal(refusalReasons.partnerTokenScope, correlationId));
      return;
    }

    const rateLimit = checkPartnerTokenRateLimit(request.partnerContext.tokenId);
    if (!rateLimit.allowed) {
      reply
        .code(429)
        .header("retry-after", String(rateLimit.retryAfterSeconds))
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: false,
            error: { code: "RATE_LIMITED", message: "Rate limit exceeded" },
            correlation_id: correlationId,
          }),
        );
      return;
    }

    if (isPartnerLookupRequest(request)) {
      const voucherId = getLookupVoucherId(request);
      if (!voucherId) {
        await writeAuditEvent({
          tenantId,
          actorId,
          eventType: "tenancy.refusal",
          reason: refusalReasons.partnerTokenScope,
          partnerAgencyId,
          correlationId,
          dbOverride: request.db,
        });
        reply
          .code(200)
          .header("content-type", "application/json")
          .send(refusal(refusalReasons.partnerTokenScope, correlationId));
        return;
      }
      const voucher = await request.db
        ?.select("partner_agency_id")
        .from("vouchers")
        .where({ id: voucherId, tenant_id: tenantId })
        .first();
      if (!voucher || voucher.partner_agency_id !== partnerAgencyId) {
        await writeAuditEvent({
          tenantId,
          actorId,
          eventType: "tenancy.refusal",
          reason: refusalReasons.partnerTokenScope,
          partnerAgencyId,
          correlationId,
          dbOverride: request.db,
        });
        reply
          .code(200)
          .header("content-type", "application/json")
          .send(refusal(refusalReasons.partnerTokenScope, correlationId));
        return;
      }

      await writeAuditEvent({
        tenantId,
        actorId,
        eventType: "partner.lookup.request",
        entityId: voucherId,
        partnerAgencyId,
        correlationId,
        dbOverride: request.db,
      });
    } else {
      await writeAuditEvent({
        tenantId,
        actorId,
        eventType: "partner.issuance.request",
        partnerAgencyId,
        correlationId,
        dbOverride: request.db,
      });
    }

    request.tenantContext = { tenantId, host };
    return;
  }

  if (!request.authContext || !request.authContext.tenantId) {
    await writeAuditEvent({
      tenantId,
      actorId,
      eventType: "tenancy.refusal",
      reason: refusalReasons.tenantContextMismatch,
      partnerAgencyId,
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
      partnerAgencyId,
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
      partnerAgencyId,
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
