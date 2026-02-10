import type { Knex } from "knex";
import {
  normalizePartnerFormConfig,
  type PartnerFormConfig,
} from "@voucher-shyft/contracts";

const ACTIVE_STATUS = "active";

type PartnerTokenRow = {
  id: string;
  form_config: unknown;
};

async function getActivePartnerTokensForAdmin(params: {
  db: Knex;
  tenantId: string;
  partnerAgencyId: string;
}): Promise<PartnerTokenRow[]> {
  return (await params.db("partner_tokens")
    .select("id", "form_config")
    .where({
      tenant_id: params.tenantId,
      partner_agency_id: params.partnerAgencyId,
      status: ACTIVE_STATUS,
    })
    .orderBy("updated_at", "desc")
    .orderBy("created_at", "desc")) as PartnerTokenRow[];
}

export async function getPartnerFormConfigByToken(params: {
  db: Knex;
  tokenId: string;
  tenantId: string;
  partnerAgencyId: string;
}): Promise<PartnerFormConfig | null> {
  const token = await params.db("partner_tokens")
    .select("form_config")
    .where({
      id: params.tokenId,
      tenant_id: params.tenantId,
      partner_agency_id: params.partnerAgencyId,
      status: ACTIVE_STATUS,
    })
    .first();

  if (!token) {
    return null;
  }

  return normalizePartnerFormConfig(token.form_config);
}

export async function getActivePartnerTokenForAdmin(params: {
  db: Knex;
  tenantId: string;
  partnerAgencyId: string;
}): Promise<{ tokenId: string; config: PartnerFormConfig } | null> {
  const tokens = await getActivePartnerTokensForAdmin({
    db: params.db,
    tenantId: params.tenantId,
    partnerAgencyId: params.partnerAgencyId,
  });
  const token = tokens[0];

  if (!token) {
    return null;
  }

  return {
    tokenId: token.id,
    config: normalizePartnerFormConfig(token.form_config),
  };
}

export async function updateActivePartnerTokenFormConfig(params: {
  db: Knex;
  tenantId: string;
  partnerAgencyId: string;
  config: PartnerFormConfig;
}): Promise<{ tokenId: string; config: PartnerFormConfig } | null> {
  const activeTokens = await getActivePartnerTokensForAdmin({
    db: params.db,
    tenantId: params.tenantId,
    partnerAgencyId: params.partnerAgencyId,
  });

  if (activeTokens.length === 0) {
    return null;
  }

  const tokenIds = activeTokens.map((token) => token.id);

  await params.db("partner_tokens")
    .whereIn("id", tokenIds)
    .update({
      form_config: params.config,
      updated_at: params.db.fn.now(),
    });

  return {
    tokenId: activeTokens[0].id,
    config: params.config,
  };
}

export function isVoucherTypeAllowed(
  config: PartnerFormConfig,
  voucherType: string,
): boolean {
  const requested = voucherType.trim().toLowerCase();
  if (!requested) {
    return false;
  }

  const allowedTypes = new Set(
    config.allowed_voucher_types.map((value) => value.trim().toLowerCase()),
  );
  return allowedTypes.has(requested);
}
