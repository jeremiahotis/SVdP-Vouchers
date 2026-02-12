import type { FastifyReply, FastifyRequest } from "fastify";

export function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): boolean {
  if (!request.authContext) {
    reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
      correlation_id: request.id,
    });
    return false;
  }
  return true;
}

export function requirePlatformAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): boolean {
  if (!requireAuth(request, reply)) {
    return false;
  }

  const roles = request.authContext?.roles ?? [];
  if (!roles.includes("platform_admin")) {
    reply.code(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Platform admin required" },
      correlation_id: request.id,
    });
    return false;
  }

  const allowlist = process.env.ADMIN_IP_ALLOWLIST;
  if (allowlist) {
    const allowed = allowlist.split(",").map((ip) => ip.trim());
    const clientIp = request.ip;
    if (!allowed.includes(clientIp)) {
      reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "IP not allowed" },
        correlation_id: request.id,
      });
      return false;
    }
  }

  return true;
}
