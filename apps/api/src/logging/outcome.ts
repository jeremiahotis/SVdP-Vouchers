import type { FastifyReply, FastifyRequest } from "fastify";

type ErrorEnvelope = {
  success: false;
  error?: { code?: string; message?: string };
  correlation_id?: string;
};

type RefusalEnvelope = {
  success: false;
  reason?: string;
  correlation_id?: string;
};

type SuccessEnvelope = {
  success: true;
  correlation_id?: string;
};

type Envelope = ErrorEnvelope | RefusalEnvelope | SuccessEnvelope;
type Outcome = "success" | "refusal" | "error";

type OutcomeLog = {
  outcome: Outcome;
  reason?: string;
  error_code?: string;
  correlation_id: string;
  tenant_id?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  if (Buffer.isBuffer(value)) {
    return false;
  }
  if (value instanceof Uint8Array) {
    return false;
  }
  if (typeof (value as { pipe?: unknown }).pipe === "function") {
    return false;
  }
  return true;
}

function isEnvelope(value: unknown): value is Envelope {
  if (!isPlainObject(value)) {
    return false;
  }
  return "success" in value;
}

export function ensureCorrelationId(request: FastifyRequest, payload: unknown) {
  if (!isEnvelope(payload)) {
    return payload;
  }
  if (payload.correlation_id) {
    return payload;
  }
  return { ...payload, correlation_id: String(request.id) };
}

export function logOutcome(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
) {
  if (!isEnvelope(payload)) {
    return;
  }

  const correlationId = payload.correlation_id ?? String(request.id);
  const tenantId = request.tenantContext?.tenantId;
  let log: OutcomeLog | null = null;

  if (payload.success === true) {
    log = { outcome: "success", correlation_id: correlationId };
  } else if ("reason" in payload && typeof payload.reason === "string") {
    log = {
      outcome: "refusal",
      reason: payload.reason,
      correlation_id: correlationId,
    };
  } else if ("error" in payload && payload.error?.code) {
    log = {
      outcome: "error",
      error_code: payload.error.code,
      correlation_id: correlationId,
    };
  } else if (reply.statusCode >= 400) {
    log = {
      outcome: "error",
      error_code: `HTTP_${reply.statusCode}`,
      correlation_id: correlationId,
    };
  }

  if (!log) {
    return;
  }
  if (tenantId) {
    log.tenant_id = tenantId;
  }

  if (log.outcome === "error") {
    request.log.error(log, "request_outcome");
  } else {
    request.log.info(log, "request_outcome");
  }
}

export function correlationIdHook(
  request: FastifyRequest,
  _reply: FastifyReply,
  payload: unknown,
) {
  return ensureCorrelationId(request, payload);
}

export function outcomeLoggingHook(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
) {
  logOutcome(request, reply, payload);
  return payload;
}
