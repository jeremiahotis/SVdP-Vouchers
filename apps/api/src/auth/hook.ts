import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyJwt } from "./jwt.js";
import { PARTNER_TOKEN_HEADER, resolvePartnerToken } from "./partner-token.js";
import { refusal, refusalReasons } from "../tenancy/refusal.js";
import { getDb } from "../db/client.js";

function logAuthFailure(request: FastifyRequest, reason: string) {
  request.log.warn({
    msg: "auth_failure",
    reason,
    correlation_id: request.id,
  });
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  if (request.url.startsWith("/health")) {
    return;
  }

  const partnerHeader = request.headers[PARTNER_TOKEN_HEADER];
  const partnerToken = Array.isArray(partnerHeader) ? partnerHeader[0] : partnerHeader;
  if (partnerToken && partnerToken.trim()) {
    const db = request.db ?? getDb();
    const record = await resolvePartnerToken(partnerToken.trim(), db);
    if (!record) {
      reply
        .code(200)
        .header("content-type", "application/json")
        .send(refusal(refusalReasons.partnerTokenInvalid, request.id));
      return;
    }
    request.partnerContext = {
      tokenId: record.tokenId,
      tenantId: record.tenantId,
      partnerAgencyId: record.partnerAgencyId,
    };
    return;
  }

  const header = request.headers.authorization;
  if (!header) {
    return;
  }

  const token = header.replace("Bearer ", "");
  try {
    const claims = await verifyJwt(token);
    if (!claims.roles.length) {
      logAuthFailure(request, "ROLES_INVALID");
      reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token" },
        correlation_id: request.id,
      });
      return;
    }

    request.authContext = {
      actorId: claims.sub,
      tenantId: claims.tenant_id,
      roles: claims.roles,
    };
  } catch {
    logAuthFailure(request, "TOKEN_INVALID");
    reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid token" },
      correlation_id: request.id,
    });
  }
}
