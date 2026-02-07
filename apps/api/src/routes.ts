import type { FastifyInstance } from "fastify";
import { errorSchema, successOrRefusalSchema, successSchema } from "./schemas/response.js";
import { registerAdminRoutes } from "./admin/routes.js";
import { writeAuditEvent } from "./audit/write.js";

const healthDataSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
  },
  required: ["ok"],
} as const;

const meDataSchema = {
  type: "object",
  properties: {
    tenant_id: { type: "string", nullable: true },
    host: { type: "string", nullable: true },
  },
  required: ["tenant_id", "host"],
} as const;

export function registerRoutes(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        tags: ["public"],
        response: {
          200: successSchema(healthDataSchema),
        },
      },
    },
    async (request) => {
      const correlationId = request.id;
      return { success: true, data: { ok: true }, correlation_id: correlationId };
    },
  );

  app.get(
    "/me",
    {
      schema: {
        tags: ["public"],
        response: {
          200: successOrRefusalSchema(meDataSchema),
          401: errorSchema,
        },
      },
    },
    async (request) => {
      const correlationId = request.id;

      if (request.authContext) {
        await writeAuditEvent({
          tenantId: request.tenantContext?.tenantId ?? null,
          actorId: request.authContext.actorId,
          eventType: "auth.me.read",
          metadata: { host: request.tenantContext?.host ?? null },
        });
      }

      return {
        success: true,
        data: {
          tenant_id: request.tenantContext?.tenantId ?? null,
          host: request.tenantContext?.host ?? null,
        },
        correlation_id: correlationId,
      };
    },
  );

  registerAdminRoutes(app);
}
