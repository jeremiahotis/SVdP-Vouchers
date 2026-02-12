import type { Knex } from "knex";
import type { VoucherIssuancePayload } from "@voucher-shyft/contracts";
import { writeAuditEvent } from "../audit/write.js";
import { refusalReasons } from "../tenancy/refusal.js";
import { getPartnerFormConfigByToken, isVoucherTypeAllowed } from "./form-config.js";
import {
  createIssuedVoucher,
  getTenantAllowedVoucherTypes,
  isVoucherTypeAllowed as isTenantVoucherTypeAllowed,
} from "../vouchers/issuance.js";

export type PartnerIssuanceResult =
  | { ok: true; voucherId: string; voucherType: string }
  | { ok: false; reason: string };

export async function issueVoucherForPartnerToken(params: {
  db: Knex;
  tenantId: string;
  partnerAgencyId: string;
  tokenId: string;
  voucherType: string;
  payload: VoucherIssuancePayload;
  correlationId: string;
}): Promise<PartnerIssuanceResult> {
  const config = await getPartnerFormConfigByToken({
    db: params.db,
    tokenId: params.tokenId,
    tenantId: params.tenantId,
    partnerAgencyId: params.partnerAgencyId,
  });

  const tenantAllowedTypes = await getTenantAllowedVoucherTypes({
    db: params.db,
    tenantId: params.tenantId,
  });

  if (
    !config ||
    !isVoucherTypeAllowed(config, params.voucherType) ||
    !isTenantVoucherTypeAllowed(tenantAllowedTypes, params.voucherType)
  ) {
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

  const normalizedVoucherType = params.voucherType.trim().toLowerCase();

  const issued = await createIssuedVoucher({
    db: params.db,
    tenantId: params.tenantId,
    voucherType: normalizedVoucherType,
    payload: params.payload,
    actorId: `partner_token:${params.tokenId}`,
    issuerMode: "partner_token",
    partnerAgencyId: params.partnerAgencyId,
  });

  await writeAuditEvent({
    tenantId: params.tenantId,
    actorId: "partner_token",
    eventType: "voucher.issued",
    entityId: issued.voucherId,
    metadata: { voucher_type: normalizedVoucherType },
    partnerAgencyId: params.partnerAgencyId,
    correlationId: params.correlationId,
    dbOverride: params.db,
  });

  return { ok: true, voucherId: issued.voucherId, voucherType: normalizedVoucherType };
}
