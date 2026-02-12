import {
  VOUCHER_DUPLICATE_POLICY_ACTIONS,
  type VoucherDuplicatePolicyAction,
  type VoucherDuplicatePolicyOutcome,
  type VoucherIdentityKey,
  normalizeVoucherIdentityKey,
  resolveVoucherDuplicatePolicyWindowDays,
  type VoucherIssuancePayload,
} from "@voucher-shyft/contracts";
import type { Knex } from "knex";
import { refusalReasons } from "../../tenancy/refusal.js";

const DAY_MS = 24 * 60 * 60 * 1000;

type DuplicateCandidateRow = {
  voucher_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  created_at: Date | string;
};

export type DuplicatePolicyResult =
  | {
      outcome: "no_match";
      reason: null;
      matched_voucher_id: null;
      policy_window_days: number;
      identity_key: VoucherIdentityKey;
    }
  | {
      outcome: Exclude<VoucherDuplicatePolicyOutcome, "no_match">;
      reason: string;
      matched_voucher_id: string;
      policy_window_days: number;
      identity_key: VoucherIdentityKey;
    };

function resolveDuplicatePolicyAction(input: unknown): VoucherDuplicatePolicyAction {
  if (typeof input !== "string") {
    return VOUCHER_DUPLICATE_POLICY_ACTIONS.refusal;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized === VOUCHER_DUPLICATE_POLICY_ACTIONS.warning) {
    return VOUCHER_DUPLICATE_POLICY_ACTIONS.warning;
  }

  return VOUCHER_DUPLICATE_POLICY_ACTIONS.refusal;
}

function resolveDuplicatePolicyOutcome(action: VoucherDuplicatePolicyAction): Exclude<
  VoucherDuplicatePolicyOutcome,
  "no_match"
> {
  return action === VOUCHER_DUPLICATE_POLICY_ACTIONS.warning ? "warning" : "refusal";
}

function resolveDuplicatePolicyReason(action: VoucherDuplicatePolicyAction): string {
  return action === VOUCHER_DUPLICATE_POLICY_ACTIONS.warning
    ? refusalReasons.duplicateWarningRequiresOverride
    : refusalReasons.duplicateInPolicyWindow;
}

function normalizeDateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export async function evaluateDuplicatePolicy(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  payload: VoucherIssuancePayload;
  now?: Date;
  policyWindowDays?: number;
  policyAction?: VoucherDuplicatePolicyAction;
}): Promise<DuplicatePolicyResult> {
  const now = params.now ?? new Date();
  const policyWindowDays = resolveVoucherDuplicatePolicyWindowDays(
    params.policyWindowDays ?? Number(process.env.VOUCHER_DUPLICATE_WINDOW_DAYS),
  );
  const policyAction = resolveDuplicatePolicyAction(
    params.policyAction ?? process.env.VOUCHER_DUPLICATE_POLICY_ACTION,
  );
  const identityKey = normalizeVoucherIdentityKey({
    voucher_type: params.voucherType,
    first_name: params.payload.first_name,
    last_name: params.payload.last_name,
    date_of_birth: params.payload.date_of_birth,
  });
  const windowStart = new Date(now.getTime() - policyWindowDays * DAY_MS);

  const candidates = (await params.db("voucher_authorizations as va")
    .join("vouchers as v", "v.id", "va.voucher_id")
    .select("va.voucher_id", "va.first_name", "va.last_name", "va.date_of_birth", "v.created_at")
    .where("va.tenant_id", params.tenantId)
    .andWhere("v.tenant_id", params.tenantId)
    .andWhere("va.voucher_type", identityKey.voucher_type)
    .andWhere("va.date_of_birth", identityKey.date_of_birth)
    .andWhere("v.created_at", ">=", windowStart)
    .orderBy("v.created_at", "desc")) as DuplicateCandidateRow[];

  const matched = candidates.find((candidate) => {
    const normalized = normalizeVoucherIdentityKey({
      voucher_type: params.voucherType,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      date_of_birth: normalizeDateOnly(candidate.date_of_birth),
    });
    return (
      normalized.voucher_type === identityKey.voucher_type &&
      normalized.first_name === identityKey.first_name &&
      normalized.last_name === identityKey.last_name &&
      normalized.date_of_birth === identityKey.date_of_birth
    );
  });

  if (!matched) {
    return {
      outcome: "no_match",
      reason: null,
      matched_voucher_id: null,
      policy_window_days: policyWindowDays,
      identity_key: identityKey,
    };
  }

  return {
    outcome: resolveDuplicatePolicyOutcome(policyAction),
    reason: resolveDuplicatePolicyReason(policyAction),
    matched_voucher_id: matched.voucher_id,
    policy_window_days: policyWindowDays,
    identity_key: identityKey,
  };
}
