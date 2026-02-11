import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  partnerFormConfigJsonSchema,
  validatePartnerFormConfigPayload,
} from "@voucher-shyft/contracts";
import { writeAuditEvent } from "../audit/write.js";
import { errorSchema, successOrRefusalSchema } from "../schemas/response.js";
import { refusal, refusalReasons } from "../tenancy/refusal.js";
import {
  getActivePartnerTokenForAdmin,
  getPartnerFormConfigByToken,
  updateActivePartnerTokenFormConfig,
} from "./form-config.js";
import { issueVoucherForPartnerToken } from "./issuance.js";

const voucherIssueBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    voucher_type: { type: "string", maxLength: 64 },
    applicant_name: { type: "string", maxLength: 120, nullable: true },
  },
  required: ["voucher_type"],
} as const;

const voucherIssueDataSchema = {
  type: "object",
  properties: {
    voucher_id: { type: "string" },
    status: { type: "string" },
    voucher_type: { type: "string" },
  },
  required: ["voucher_id", "status", "voucher_type"],
} as const;

const voucherLookupQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    voucher_id: { type: "string" },
  },
  required: ["voucher_id"],
} as const;

const voucherLookupDataSchema = {
  type: "object",
  properties: {
    voucher_id: { type: "string" },
    status: { type: "string" },
  },
  required: ["voucher_id", "status"],
} as const;

const partnerIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    partner_agency_id: { type: "string" },
  },
  required: ["partner_agency_id"],
} as const;

const emptyQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
} as const;

function refusalReply(reply: FastifyReply, reason: string, correlationId: string) {
  return reply
    .code(200)
    .header("content-type", "application/json")
    .send(refusal(reason, correlationId));
}

function badRequest(reply: FastifyReply, request: FastifyRequest, message: string) {
  return reply.code(400).send({
    success: false,
    error: { code: "BAD_REQUEST", message },
    correlation_id: request.id,
  });
}

async function hasStoreAdminPermission(request: FastifyRequest): Promise<boolean> {
  if (request.authContext?.roles.includes("platform_admin")) {
    return true;
  }

  const tenantId = request.tenantContext?.tenantId;
  const actorId = request.authContext?.actorId;
  if (!tenantId || !actorId || !request.db) {
    return false;
  }

  const membership = await request.db("memberships")
    .select("id")
    .where({
      tenant_id: tenantId,
      actor_id: actorId,
      role: "store_admin",
    })
    .first();

  return Boolean(membership);
}

function partnerFormConfigSchemaRecord(): Record<string, unknown> {
  return partnerFormConfigJsonSchema as unknown as Record<string, unknown>;
}

export function registerPartnerRoutes(app: FastifyInstance) {
  app.get(
    "/v1/partner/form-config",
    {
      schema: {
        tags: ["partner"],
        querystring: emptyQuerySchema,
        response: {
          200: successOrRefusalSchema(partnerFormConfigSchemaRecord()),
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.partnerContext) {
        return refusalReply(reply, refusalReasons.partnerTokenScope, request.id);
      }

      if (!request.db) {
        throw new Error("Database transaction unavailable");
      }

      const config = await getPartnerFormConfigByToken({
        db: request.db,
        tokenId: request.partnerContext.tokenId,
        tenantId: request.partnerContext.tenantId,
        partnerAgencyId: request.partnerContext.partnerAgencyId,
      });
      if (!config) {
        return refusalReply(reply, refusalReasons.partnerTokenInvalid, request.id);
      }

      return reply
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: true,
            data: config,
            correlation_id: request.id,
          }),
        );
    },
  );

  app.get(
    "/v1/store-admin/partners/:partner_agency_id/form-config",
    {
      schema: {
        tags: ["store-admin"],
        params: partnerIdParamsSchema,
        querystring: emptyQuerySchema,
        response: {
          200: successOrRefusalSchema(partnerFormConfigSchemaRecord()),
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.authContext) {
        return reply.code(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
          correlation_id: request.id,
        });
      }

      if (!request.db) {
        throw new Error("Database transaction unavailable");
      }

      const tenantId = request.tenantContext?.tenantId;
      if (!tenantId) {
        throw new Error("Tenant context unavailable");
      }

      const canManage = await hasStoreAdminPermission(request);
      if (!canManage) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      const params = request.params as { partner_agency_id: string };
      const tokenRecord = await getActivePartnerTokenForAdmin({
        db: request.db,
        tenantId,
        partnerAgencyId: params.partner_agency_id,
      });
      if (!tokenRecord) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      return reply
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: true,
            data: tokenRecord.config,
            correlation_id: request.id,
          }),
        );
    },
  );

  app.put(
    "/v1/store-admin/partners/:partner_agency_id/form-config",
    {
      schema: {
        tags: ["store-admin"],
        params: partnerIdParamsSchema,
        body: partnerFormConfigJsonSchema,
        querystring: emptyQuerySchema,
        response: {
          200: successOrRefusalSchema(partnerFormConfigSchemaRecord()),
          400: errorSchema,
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.authContext) {
        return reply.code(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
          correlation_id: request.id,
        });
      }

      if (!request.db) {
        throw new Error("Database transaction unavailable");
      }

      const tenantId = request.tenantContext?.tenantId;
      if (!tenantId) {
        throw new Error("Tenant context unavailable");
      }

      const canManage = await hasStoreAdminPermission(request);
      if (!canManage) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      const validated = validatePartnerFormConfigPayload(request.body);
      if (!validated.ok) {
        return badRequest(reply, request, validated.errors.map((error) => error.message).join("; "));
      }

      const params = request.params as { partner_agency_id: string };
      const updated = await updateActivePartnerTokenFormConfig({
        db: request.db,
        tenantId,
        partnerAgencyId: params.partner_agency_id,
        config: validated.value,
      });
      if (!updated) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      await writeAuditEvent({
        tenantId,
        actorId: request.authContext.actorId,
        eventType: "partner.form_config.updated",
        entityId: params.partner_agency_id,
        metadata: {
          token_id: updated.tokenId,
          allowed_voucher_type_count: validated.value.allowed_voucher_types.length,
          rules_count: validated.value.rules_list.length,
        },
        correlationId: request.id,
        dbOverride: request.db,
      });

      return reply
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: true,
            data: updated.config,
            correlation_id: request.id,
          }),
        );
    },
  );

  app.post(
    "/v1/vouchers",
    {
      schema: {
        tags: ["partner"],
        body: voucherIssueBodySchema,
        response: {
          200: successOrRefusalSchema(voucherIssueDataSchema),
          400: errorSchema,
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.partnerContext) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      if (!request.db) {
        throw new Error("Database transaction unavailable");
      }

      const tenantId = request.tenantContext?.tenantId;
      if (!tenantId) {
        throw new Error("Tenant context unavailable");
      }

      const voucherTypeRaw = (request.body as { voucher_type: string }).voucher_type;
      const voucherType = voucherTypeRaw.trim().toLowerCase();
      if (!voucherType) {
        return badRequest(reply, request, "voucher_type is required");
      }

      const issuance = await issueVoucherForPartnerToken({
        db: request.db,
        tenantId,
        partnerAgencyId: request.partnerContext.partnerAgencyId,
        tokenId: request.partnerContext.tokenId,
        voucherType,
        correlationId: request.id,
      });

      if (!issuance.ok) {
        return refusalReply(reply, issuance.reason, request.id);
      }

      return reply
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: true,
            data: {
              voucher_id: issuance.voucherId,
              status: "active",
              voucher_type: issuance.voucherType,
            },
            correlation_id: request.id,
          }),
        );
    },
  );

  app.get(
    "/v1/vouchers/lookup",
    {
      schema: {
        tags: ["partner"],
        querystring: voucherLookupQuerySchema,
        response: {
          200: successOrRefusalSchema(voucherLookupDataSchema),
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.partnerContext) {
        return refusalReply(reply, refusalReasons.notAuthorizedForAction, request.id);
      }

      if (!request.db) {
        throw new Error("Database transaction unavailable");
      }

      const tenantId = request.tenantContext?.tenantId;
      if (!tenantId) {
        throw new Error("Tenant context unavailable");
      }

      const voucherId = (request.query as { voucher_id: string }).voucher_id;
      const voucher = await request.db("vouchers")
        .select("id", "status", "partner_agency_id")
        .where({
          id: voucherId,
          tenant_id: tenantId,
        })
        .first();

      if (!voucher || voucher.partner_agency_id !== request.partnerContext.partnerAgencyId) {
        return refusalReply(reply, refusalReasons.partnerTokenScope, request.id);
      }

      return reply
        .header("content-type", "application/json")
        .send(
          JSON.stringify({
            success: true,
            data: { voucher_id: voucher.id as string, status: voucher.status as string },
            correlation_id: request.id,
          }),
        );
    },
  );
}
