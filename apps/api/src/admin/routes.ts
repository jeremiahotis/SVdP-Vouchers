import type { FastifyInstance } from "fastify";
import { getDb } from "../db/client";
import { requirePlatformAdmin } from "./guards";
import { writeAuditEvent } from "./audit";
import { errorSchema, successSchema } from "../schemas/response";

const tenantSchema = {
  type: "object",
  properties: {
    tenant_id: { type: "string" },
    host: { type: "string" },
    tenant_slug: { type: "string", nullable: true },
    status: { type: "string" },
  },
  required: ["tenant_id", "host", "status"],
} as const;

const tenantAppSchema = {
  type: "object",
  properties: {
    tenant_id: { type: "string" },
    app_key: { type: "string" },
    enabled: { type: "boolean" },
  },
  required: ["tenant_id", "app_key", "enabled"],
} as const;

const adminErrorResponses = {
  401: errorSchema,
  403: errorSchema,
};

export function registerAdminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/tenants",
    {
      schema: {
        tags: ["admin"],
        response: {
          200: successSchema({
            type: "array",
            items: tenantSchema,
          }),
          ...adminErrorResponses,
        },
      },
    },
    async (request, reply) => {
      if (!requirePlatformAdmin(request, reply)) {
        return;
      }

      const rows = await getDb()("platform.tenants")
        .select("tenant_id", "host", "tenant_slug", "status")
        .orderBy("host", "asc");

      return { success: true, data: rows, correlation_id: request.id };
    },
  );

  app.post(
    "/admin/tenants",
    {
      schema: {
        tags: ["admin"],
        body: {
          type: "object",
          properties: {
            tenant_id: { type: "string" },
            host: { type: "string" },
            tenant_slug: { type: "string", nullable: true },
            status: { type: "string", nullable: true },
          },
          required: ["tenant_id", "host"],
        },
        response: {
          200: successSchema(tenantSchema),
          ...adminErrorResponses,
          ...adminErrorResponses,
          ...adminErrorResponses,
        },
      },
    },
    async (request, reply) => {
      if (!requirePlatformAdmin(request, reply)) {
        return;
      }

      const body = request.body as {
        tenant_id: string;
        host: string;
        tenant_slug?: string | null;
        status?: string | null;
      };

      const [row] = await getDb()("platform.tenants")
        .insert({
          tenant_id: body.tenant_id,
          host: body.host,
          tenant_slug: body.tenant_slug ?? null,
          status: body.status ?? "active",
        })
        .returning(["tenant_id", "host", "tenant_slug", "status"]);

      await writeAuditEvent({
        tenantId: body.tenant_id,
        actorId: request.authContext?.actorId ?? "unknown",
        eventType: "platform.tenant.created",
        entityId: body.tenant_id,
        metadata: { host: body.host },
      });

      return { success: true, data: row, correlation_id: request.id };
    },
  );

  app.patch(
    "/admin/tenants/:tenant_id",
    {
      schema: {
        tags: ["admin"],
        body: {
          type: "object",
          properties: {
            host: { type: "string", nullable: true },
            tenant_slug: { type: "string", nullable: true },
            status: { type: "string", nullable: true },
          },
        },
        response: {
          200: successSchema(tenantSchema),
        },
      },
    },
    async (request, reply) => {
      if (!requirePlatformAdmin(request, reply)) {
        return;
      }

      const params = request.params as { tenant_id: string };
      const body = request.body as {
        host?: string | null;
        tenant_slug?: string | null;
        status?: string | null;
      };

      const [row] = await getDb()("platform.tenants")
        .where({ tenant_id: params.tenant_id })
        .update({
          host: body.host ?? undefined,
          tenant_slug: body.tenant_slug ?? undefined,
          status: body.status ?? undefined,
          updated_at: getDb().fn.now(),
        })
        .returning(["tenant_id", "host", "tenant_slug", "status"]);

      await writeAuditEvent({
        tenantId: params.tenant_id,
        actorId: request.authContext?.actorId ?? "unknown",
        eventType: "platform.tenant.updated",
        entityId: params.tenant_id,
      });

      return { success: true, data: row, correlation_id: request.id };
    },
  );

  app.post(
    "/admin/tenant-apps",
    {
      schema: {
        tags: ["admin"],
        body: {
          type: "object",
          properties: {
            tenant_id: { type: "string" },
            app_key: { type: "string" },
            enabled: { type: "boolean" },
          },
          required: ["tenant_id", "app_key", "enabled"],
        },
        response: {
          200: successSchema(tenantAppSchema),
          ...adminErrorResponses,
        },
      },
    },
    async (request, reply) => {
      if (!requirePlatformAdmin(request, reply)) {
        return;
      }

      const body = request.body as {
        tenant_id: string;
        app_key: string;
        enabled: boolean;
      };

      const [row] = await getDb()("platform.tenant_apps")
        .insert({
          tenant_id: body.tenant_id,
          app_key: body.app_key,
          enabled: body.enabled,
        })
        .onConflict(["tenant_id", "app_key"])
        .merge({
          enabled: body.enabled,
          updated_at: getDb().fn.now(),
        })
        .returning(["tenant_id", "app_key", "enabled"]);

      await writeAuditEvent({
        tenantId: body.tenant_id,
        actorId: request.authContext?.actorId ?? "unknown",
        eventType: "platform.tenant_app.set",
        entityId: `${body.tenant_id}:${body.app_key}`,
      });

      return { success: true, data: row, correlation_id: request.id };
    },
  );
}
