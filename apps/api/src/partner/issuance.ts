import { randomUUID } from "crypto";
import type { Knex } from "knex";
import { writeAuditEvent } from "../audit/write.js";
import { refusalReasons } from "../tenancy/refusal.js";
import { getPartnerFormConfigByToken, isVoucherTypeAllowed } from "./form-config.js";

export type PartnerIssuanceResult =
  | { ok: true; voucherId: string; voucherType: string }
  | { ok: false; reason: string };

export async function issueVoucherForPartnerToken(params: {
  db: Knex;
  tenantId: string;
  partnerAgencyId: string;
  tokenId: string;
  voucherType: string;
  correlationId: string;
}): Promise<PartnerIssuanceResult> {
  const config = await getPartnerFormConfigByToken({
    db: params.db,
    tokenId: params.tokenId,
    tenantId: params.tenantId,
    partnerAgencyId: params.partnerAgencyId,
  });

  if (!config || !isVoucherTypeAllowed(config, params.voucherType)) {
    await writeAuditEvent({
      tenantId: params.tenantId,
      actorId: "partner_token",
      eventType: "partner.issuance.refused",
      reason: refusalReasons.notAuthorizedForAction,
      metadata: { voucher_type: params.voucherType.trim().toLowerCase() },
      partnerAgencyId: params.partnerAgencyId,
      correlationId: params.correlationId,
      dbOverride: params.db,
    });
    return {
      ok: false,
      reason: refusalReasons.notAuthorizedForAction,
    };
  }

  const voucherId = randomUUID();
  const normalizedVoucherType = params.voucherType.trim().toLowerCase();

  await params.db("vouchers").insert({
    id: voucherId,
    tenant_id: params.tenantId,
    status: "active",
    partner_agency_id: params.partnerAgencyId,
  });

  await writeAuditEvent({
    tenantId: params.tenantId,
    actorId: "partner_token",
    eventType: "voucher.issued",
    entityId: voucherId,
    metadata: { voucher_type: normalizedVoucherType },
    partnerAgencyId: params.partnerAgencyId,
    correlationId: params.correlationId,
    dbOverride: params.db,
  });

  return { ok: true, voucherId, voucherType: normalizedVoucherType };
}
