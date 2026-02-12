export const VOUCHER_ISSUANCE_LIMITS = {
  maxVoucherTypeLength: 64,
  maxNameLength: 80,
  maxHouseholdCount: 20,
} as const;

export const DEFAULT_TENANT_ALLOWED_VOUCHER_TYPES = [
  "clothing",
  "furniture",
  "household",
] as const;

export type VoucherIssuancePayload = {
  voucher_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  household_adults: number;
  household_children: number;
};

const VOUCHER_ISSUANCE_FIELDS = [
  "voucher_type",
  "first_name",
  "last_name",
  "date_of_birth",
  "household_adults",
  "household_children",
] as const;

export type VoucherIssuanceValidationError = {
  field: keyof VoucherIssuancePayload | "root";
  message: string;
};

export type VoucherIssuanceValidationResult =
  | { ok: true; value: VoucherIssuancePayload }
  | { ok: false; errors: VoucherIssuanceValidationError[] };

export const voucherIssuanceBodyJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    voucher_type: { type: "string", maxLength: VOUCHER_ISSUANCE_LIMITS.maxVoucherTypeLength },
    first_name: { type: "string", maxLength: VOUCHER_ISSUANCE_LIMITS.maxNameLength },
    last_name: { type: "string", maxLength: VOUCHER_ISSUANCE_LIMITS.maxNameLength },
    date_of_birth: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    household_adults: {
      type: "integer",
      minimum: 0,
      maximum: VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount,
    },
    household_children: {
      type: "integer",
      minimum: 0,
      maximum: VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount,
    },
  },
  required: [
    "voucher_type",
    "first_name",
    "last_name",
    "date_of_birth",
    "household_adults",
    "household_children",
  ],
} as const;

export const voucherIssuedDataJsonSchema = {
  type: "object",
  properties: {
    voucher_id: { type: "string" },
    status: { const: "active" },
    voucher_type: { type: "string" },
  },
  required: ["voucher_id", "status", "voucher_type"],
} as const;

export const voucherPendingDataJsonSchema = {
  type: "object",
  properties: {
    request_id: { type: "string" },
    status: { const: "pending" },
    voucher_type: { type: "string" },
  },
  required: ["request_id", "status", "voucher_type"],
} as const;

export const voucherIssuanceResponseDataJsonSchema = {
  oneOf: [voucherIssuedDataJsonSchema, voucherPendingDataJsonSchema],
} as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeVoucherType(value: string): string {
  return normalizeText(value, VOUCHER_ISSUANCE_LIMITS.maxVoucherTypeLength).toLowerCase();
}

function normalizeHouseholdValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const bounded = Math.max(0, Math.min(VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount, Math.floor(value)));
  return bounded;
}

function isIsoDate(value: string): boolean {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(`${value}T`);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export function normalizeVoucherIssuancePayload(input: unknown): VoucherIssuancePayload {
  if (!isPlainObject(input)) {
    return {
      voucher_type: "",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      household_adults: 0,
      household_children: 0,
    };
  }

  return {
    voucher_type:
      typeof input.voucher_type === "string" ? normalizeVoucherType(input.voucher_type) : "",
    first_name:
      typeof input.first_name === "string"
        ? normalizeText(input.first_name, VOUCHER_ISSUANCE_LIMITS.maxNameLength)
        : "",
    last_name:
      typeof input.last_name === "string"
        ? normalizeText(input.last_name, VOUCHER_ISSUANCE_LIMITS.maxNameLength)
        : "",
    date_of_birth: typeof input.date_of_birth === "string" ? input.date_of_birth.trim() : "",
    household_adults:
      typeof input.household_adults === "number"
        ? normalizeHouseholdValue(input.household_adults)
        : 0,
    household_children:
      typeof input.household_children === "number"
        ? normalizeHouseholdValue(input.household_children)
        : 0,
  };
}

export function validateVoucherIssuancePayload(input: unknown): VoucherIssuanceValidationResult {
  if (!isPlainObject(input)) {
    return {
      ok: false,
      errors: [{ field: "root", message: "payload must be an object" }],
    };
  }

  const errors: VoucherIssuanceValidationError[] = [];

  const unknownFields = Object.keys(input).filter(
    (field) => !VOUCHER_ISSUANCE_FIELDS.includes(field as (typeof VOUCHER_ISSUANCE_FIELDS)[number]),
  );
  if (unknownFields.length > 0) {
    errors.push({
      field: "root",
      message: `unexpected fields: ${unknownFields.join(", ")}`,
    });
  }

  if (typeof input.voucher_type !== "string") {
    errors.push({ field: "voucher_type", message: "voucher_type is required" });
  } else if (input.voucher_type.length > VOUCHER_ISSUANCE_LIMITS.maxVoucherTypeLength) {
    errors.push({
      field: "voucher_type",
      message: `voucher_type must not exceed ${VOUCHER_ISSUANCE_LIMITS.maxVoucherTypeLength} characters`,
    });
  }

  if (typeof input.first_name !== "string") {
    errors.push({ field: "first_name", message: "first_name is required" });
  } else if (input.first_name.length > VOUCHER_ISSUANCE_LIMITS.maxNameLength) {
    errors.push({
      field: "first_name",
      message: `first_name must not exceed ${VOUCHER_ISSUANCE_LIMITS.maxNameLength} characters`,
    });
  }

  if (typeof input.last_name !== "string") {
    errors.push({ field: "last_name", message: "last_name is required" });
  } else if (input.last_name.length > VOUCHER_ISSUANCE_LIMITS.maxNameLength) {
    errors.push({
      field: "last_name",
      message: `last_name must not exceed ${VOUCHER_ISSUANCE_LIMITS.maxNameLength} characters`,
    });
  }

  if (typeof input.date_of_birth !== "string") {
    errors.push({ field: "date_of_birth", message: "date_of_birth is required" });
  }

  const householdAdults = input.household_adults;
  if (!isInteger(householdAdults)) {
    errors.push({
      field: "household_adults",
      message: "household_adults must be an integer",
    });
  } else if (
    householdAdults < 0 ||
    householdAdults > VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount
  ) {
    errors.push({
      field: "household_adults",
      message: `household_adults must be between 0 and ${VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount}`,
    });
  }

  const householdChildren = input.household_children;
  if (!isInteger(householdChildren)) {
    errors.push({
      field: "household_children",
      message: "household_children must be an integer",
    });
  } else if (
    householdChildren < 0 ||
    householdChildren > VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount
  ) {
    errors.push({
      field: "household_children",
      message: `household_children must be between 0 and ${VOUCHER_ISSUANCE_LIMITS.maxHouseholdCount}`,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalized = normalizeVoucherIssuancePayload(input);

  if (!normalized.voucher_type) {
    errors.push({ field: "voucher_type", message: "voucher_type is required" });
  }

  if (!normalized.first_name) {
    errors.push({ field: "first_name", message: "first_name is required" });
  }

  if (!normalized.last_name) {
    errors.push({ field: "last_name", message: "last_name is required" });
  }

  if (!normalized.date_of_birth || !isIsoDate(normalized.date_of_birth)) {
    errors.push({
      field: "date_of_birth",
      message: "date_of_birth must be an ISO date string (YYYY-MM-DD)",
    });
  }

  if (normalized.household_adults + normalized.household_children <= 0) {
    errors.push({
      field: "household_adults",
      message: "at least one household member is required",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: normalized };
}
