import type { FastifyReply, FastifyRequest } from "fastify";
import { APP_KEY } from "../config/app";
import { resolveTenantIdByHost } from "./resolve";
import { refusal, refusalReasons } from "./refusal";
import { isAppEnabled } from "../platform/registry";

export async function tenantContextHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.url.startsWith("/health")) {
    return;
  }

  const hostHeader = request.headers.host ?? "";
  const host = hostHeader.split(":")[0];
  const correlationId = request.id;

  if (!host) {
    reply.code(200).send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  const tenantId = await resolveTenantIdByHost(host);
  if (!tenantId) {
    reply.code(200).send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  const enabled = await isAppEnabled(tenantId, APP_KEY);
  if (!enabled) {
    reply.code(200).send(refusal(refusalReasons.tenantNotFound, correlationId));
    return;
  }

  const tenantClaim = request.authContext?.tenantId;
  if (tenantClaim && tenantClaim !== tenantId) {
    reply
      .code(200)
      .send(refusal(refusalReasons.tenantContextMismatch, correlationId));
    return;
  }

  request.tenantContext = { tenantId, host };
}
