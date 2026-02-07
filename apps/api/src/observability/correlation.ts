import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

type ErrorWithStatus = Error & {
  statusCode?: number;
  code?: string;
};

export function registerCorrelation(app: FastifyInstance) {
  app.addHook("onRequest", (request, reply, done) => {
    reply.header("x-correlation-id", request.id);
    done();
  });

  app.addHook("preSerialization", (request, _reply, payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || Buffer.isBuffer(payload)) {
      return payload;
    }

    const record = payload as Record<string, unknown>;
    const logContext = {
      tenant_id: request.tenantContext?.tenantId ?? null,
      actor_id: request.authContext?.actorId ?? null,
      request_id: request.id,
    };

    if (record.success === false && typeof record.reason === "string" && !record.error) {
      request.log.info(
        {
          outcome: "refusal",
          reason: record.reason,
          correlation_id: request.id,
          ...logContext,
        },
        "refusal",
      );
    }

    if ("correlation_id" in payload) {
      return payload;
    }

    return { ...payload, correlation_id: request.id };
  });

  app.setErrorHandler((error: ErrorWithStatus, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;
    const errorCode = error.code ?? "INTERNAL_SERVER_ERROR";

    const logContext = {
      tenant_id: request.tenantContext?.tenantId ?? null,
      actor_id: request.authContext?.actorId ?? null,
      request_id: request.id,
    };

    request.log.error(
      {
        outcome: "error",
        error_code: errorCode,
        correlation_id: request.id,
        ...logContext,
      },
      "error",
    );

    reply.code(statusCode).send({
      success: false,
      error: {
        code: errorCode,
        message: error.message,
      },
      correlation_id: request.id,
    });
  });
}
