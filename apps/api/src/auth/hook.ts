import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyJwt } from "./jwt";

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
