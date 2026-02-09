import { createHash } from "crypto";
import type { Knex } from "knex";

export const PARTNER_TOKEN_HEADER = "x-partner-token";
const PARTNER_TOKEN_STATUS_ACTIVE = "active";
const PARTNER_AGENCY_STATUS_ACTIVE = "active";

export function hashPartnerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function resolvePartnerToken(token: string, db: Knex): Promise<{
  tokenId: string;
  tenantId: string;
  partnerAgencyId: string;
} | null> {
  const tokenHash = hashPartnerToken(token);
  const record = await db("partner_tokens")
    .select(
      "partner_tokens.id as token_id",
      "partner_tokens.tenant_id",
      "partner_tokens.partner_agency_id",
    )
    .join("partner_agencies", function joinPartnerAgencies() {
      this.on("partner_agencies.id", "partner_tokens.partner_agency_id").andOn(
        "partner_agencies.tenant_id",
        "partner_tokens.tenant_id",
      );
    })
    .where({
      "partner_tokens.token_hash": tokenHash,
      "partner_tokens.status": PARTNER_TOKEN_STATUS_ACTIVE,
      "partner_agencies.status": PARTNER_AGENCY_STATUS_ACTIVE,
    })
    .first();

  if (!record) {
    return null;
  }

  return {
    tokenId: record.token_id as string,
    tenantId: record.tenant_id as string,
    partnerAgencyId: record.partner_agency_id as string,
  };
}
