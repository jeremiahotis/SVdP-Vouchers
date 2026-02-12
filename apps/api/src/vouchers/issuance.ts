import { randomUUID } from "crypto";
import {
  DEFAULT_TENANT_ALLOWED_VOUCHER_TYPES,
  type VoucherIssuancePayload,
} from "@voucher-shyft/contracts";
import type { Knex } from "knex";

const ACTIVE_ISSUER_MEMBERSHIP_ROLES = new Set(["store_admin", "steward"]);
const INITIATE_ONLY_MEMBERSHIP_ROLES = new Set(["steward_initiate_only"]);

type MembershipRoleRow = {
  role: string;
};

type TenantVoucherTypeConfigRow = {
  allowed_voucher_types: unknown;
};

export type AuthIssuanceMode = "issue_active" | "initiate_only" | "none";

function normalizeVoucherType(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAllowedVoucherTypes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = normalizeVoucherType(item);
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
  }

  return Array.from(unique);
}

function defaultAllowedVoucherTypes(): string[] {
  return [...DEFAULT_TENANT_ALLOWED_VOUCHER_TYPES];
}

async function getTenantVoucherTypeConfigRow(
  db: Knex,
  tenantId: string,
): Promise<TenantVoucherTypeConfigRow | undefined> {
  return (await db("tenant_voucher_type_configs")
    .select("allowed_voucher_types")
    .where({ tenant_id: tenantId })
    .first()) as TenantVoucherTypeConfigRow | undefined;
}

async function ensureTenantVoucherTypeConfig(db: Knex, tenantId: string): Promise<void> {
  await db("tenant_voucher_type_configs")
    .insert({
      tenant_id: tenantId,
      allowed_voucher_types: db.raw("?::jsonb", [JSON.stringify(defaultAllowedVoucherTypes())]),
    })
    .onConflict("tenant_id")
    .ignore();
}

export async function getTenantAllowedVoucherTypes(params: {
  db: Knex;
  tenantId: string;
}): Promise<string[]> {
  let row = await getTenantVoucherTypeConfigRow(params.db, params.tenantId);

  if (!row) {
    await ensureTenantVoucherTypeConfig(params.db, params.tenantId);
    row = await getTenantVoucherTypeConfigRow(params.db, params.tenantId);
  }

  if (!row) {
    return defaultAllowedVoucherTypes();
  }

  return normalizeAllowedVoucherTypes(row.allowed_voucher_types);
}

export function isVoucherTypeAllowed(
  allowedVoucherTypes: string[],
  voucherType: string,
): boolean {
  const requested = normalizeVoucherType(voucherType);
  if (!requested) {
    return false;
  }

  const allowed = new Set(allowedVoucherTypes.map((value) => normalizeVoucherType(value)));
  return allowed.has(requested);
}

export async function resolveAuthIssuanceMode(params: {
  db: Knex;
  tenantId: string;
  actorId: string;
  authRoles: string[];
}): Promise<AuthIssuanceMode> {
  if (params.authRoles.map((role) => role.trim().toLowerCase()).includes("platform_admin")) {
    return "issue_active";
  }

  const memberships = (await params.db("memberships")
    .select("role")
    .where({
      tenant_id: params.tenantId,
      actor_id: params.actorId,
    })) as MembershipRoleRow[];

  const roles = memberships.map((membership) => membership.role.trim().toLowerCase());

  if (roles.some((role) => ACTIVE_ISSUER_MEMBERSHIP_ROLES.has(role))) {
    return "issue_active";
  }

  if (roles.some((role) => INITIATE_ONLY_MEMBERSHIP_ROLES.has(role))) {
    return "initiate_only";
  }

  return "none";
}

export async function createIssuedVoucher(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  payload: VoucherIssuancePayload;
  actorId: string;
  issuerMode: "auth" | "partner_token";
  partnerAgencyId?: string | null;
}): Promise<{ voucherId: string }> {
  const voucherId = randomUUID();
  const authorizationId = randomUUID();

  await params.db("vouchers").insert({
    id: voucherId,
    tenant_id: params.tenantId,
    status: "active",
    voucher_type: params.voucherType,
    partner_agency_id: params.partnerAgencyId ?? null,
  });

  await params.db("voucher_authorizations").insert({
    id: authorizationId,
    voucher_id: voucherId,
    tenant_id: params.tenantId,
    voucher_type: params.voucherType,
    first_name: params.payload.first_name,
    last_name: params.payload.last_name,
    date_of_birth: params.payload.date_of_birth,
    household_adults: params.payload.household_adults,
    household_children: params.payload.household_children,
    issuer_mode: params.issuerMode,
    actor_id: params.actorId,
    partner_agency_id: params.partnerAgencyId ?? null,
  });

  return { voucherId };
}

export async function createPendingVoucherRequest(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  payload: VoucherIssuancePayload;
  actorId: string;
  partnerAgencyId?: string | null;
}): Promise<{ requestId: string }> {
  const requestId = randomUUID();

  await params.db("voucher_requests").insert({
    id: requestId,
    tenant_id: params.tenantId,
    voucher_type: params.voucherType,
    first_name: params.payload.first_name,
    last_name: params.payload.last_name,
    date_of_birth: params.payload.date_of_birth,
    household_adults: params.payload.household_adults,
    household_children: params.payload.household_children,
    status: "pending",
    actor_id: params.actorId,
    partner_agency_id: params.partnerAgencyId ?? null,
  });

  return { requestId };
}
