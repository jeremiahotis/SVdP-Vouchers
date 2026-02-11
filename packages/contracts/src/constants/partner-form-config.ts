export const PARTNER_FORM_CONFIG_LIMITS = {
  maxAllowedVoucherTypes: 8,
  maxVoucherTypeLength: 64,
  maxIntroTextLength: 600,
  maxRules: 12,
  maxRuleLength: 240,
} as const;

export const PARTNER_FORM_CONFIG_FIELDS = [
  "allowed_voucher_types",
  "intro_text",
  "rules_list",
] as const;

export type PartnerFormConfigField = (typeof PARTNER_FORM_CONFIG_FIELDS)[number];

export type PartnerFormConfig = {
  allowed_voucher_types: string[];
  intro_text: string;
  rules_list: string[];
};

export type PartnerFormConfigValidationError = {
  field: PartnerFormConfigField | "root";
  message: string;
};

export type PartnerFormConfigValidationResult =
  | { ok: true; value: PartnerFormConfig }
  | { ok: false; errors: PartnerFormConfigValidationError[] };

export const DEFAULT_PARTNER_FORM_CONFIG: PartnerFormConfig = {
  allowed_voucher_types: [],
  intro_text: "",
  rules_list: [],
};

export const partnerFormConfigJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowed_voucher_types: {
      type: "array",
      maxItems: PARTNER_FORM_CONFIG_LIMITS.maxAllowedVoucherTypes,
      items: {
        type: "string",
        maxLength: PARTNER_FORM_CONFIG_LIMITS.maxVoucherTypeLength,
      },
    },
    intro_text: {
      type: "string",
      maxLength: PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength,
    },
    rules_list: {
      type: "array",
      maxItems: PARTNER_FORM_CONFIG_LIMITS.maxRules,
      items: {
        type: "string",
        maxLength: PARTNER_FORM_CONFIG_LIMITS.maxRuleLength,
      },
    },
  },
  required: PARTNER_FORM_CONFIG_FIELDS,
} as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function normalizePlainText(value: string, maxLength: number): string {
  return stripHtml(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeVoucherType(value: string): string {
  return value.trim().toLowerCase().slice(0, PARTNER_FORM_CONFIG_LIMITS.maxVoucherTypeLength);
}

function uniqueStrings(values: string[], keyFn?: (value: string) => string): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const key = keyFn ? keyFn(value) : value;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(value);
  }
  return normalized;
}

function normalizeAllowedVoucherTypes(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizeVoucherType(value))
    .filter((value) => value.length > 0)
    .slice(0, PARTNER_FORM_CONFIG_LIMITS.maxAllowedVoucherTypes);
  return uniqueStrings(normalized);
}

function normalizeRulesList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizePlainText(value, PARTNER_FORM_CONFIG_LIMITS.maxRuleLength))
    .filter((value) => value.length > 0)
    .slice(0, PARTNER_FORM_CONFIG_LIMITS.maxRules);
  return uniqueStrings(normalized, (value) => value.toLowerCase());
}

function validateVoucherTypeFormat(
  allowedVoucherTypes: string[],
): PartnerFormConfigValidationError[] {
  const errors: PartnerFormConfigValidationError[] = [];
  const slugPattern = /^[a-z0-9][a-z0-9_-]*$/;
  for (const value of allowedVoucherTypes) {
    if (!slugPattern.test(value)) {
      errors.push({
        field: "allowed_voucher_types",
        message: "voucher types must be lowercase slug-like values",
      });
      break;
    }
  }
  return errors;
}

export function normalizePartnerFormConfig(input: unknown): PartnerFormConfig {
  if (!isPlainObject(input)) {
    return { ...DEFAULT_PARTNER_FORM_CONFIG };
  }

  return {
    allowed_voucher_types: normalizeAllowedVoucherTypes(input.allowed_voucher_types),
    intro_text:
      typeof input.intro_text === "string"
        ? normalizePlainText(input.intro_text, PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength)
        : "",
    rules_list: normalizeRulesList(input.rules_list),
  };
}

export function validatePartnerFormConfigPayload(
  input: unknown,
): PartnerFormConfigValidationResult {
  if (!isPlainObject(input)) {
    return {
      ok: false,
      errors: [{ field: "root", message: "payload must be an object" }],
    };
  }

  const errors: PartnerFormConfigValidationError[] = [];

  const unknownFields = Object.keys(input).filter(
    (field) => !PARTNER_FORM_CONFIG_FIELDS.includes(field as PartnerFormConfigField),
  );
  if (unknownFields.length > 0) {
    errors.push({
      field: "root",
      message: `unexpected fields: ${unknownFields.join(", ")}`,
    });
  }

  if (!Array.isArray(input.allowed_voucher_types)) {
    errors.push({
      field: "allowed_voucher_types",
      message: "allowed_voucher_types must be an array of strings",
    });
  } else {
    if (input.allowed_voucher_types.length > PARTNER_FORM_CONFIG_LIMITS.maxAllowedVoucherTypes) {
      errors.push({
        field: "allowed_voucher_types",
        message: `allowed_voucher_types must not exceed ${PARTNER_FORM_CONFIG_LIMITS.maxAllowedVoucherTypes} items`,
      });
    }
    if (input.allowed_voucher_types.some((value) => typeof value !== "string")) {
      errors.push({
        field: "allowed_voucher_types",
        message: "allowed_voucher_types must contain only strings",
      });
    }
    if (
      input.allowed_voucher_types.some(
        (value) =>
          typeof value === "string" &&
          value.length > PARTNER_FORM_CONFIG_LIMITS.maxVoucherTypeLength,
      )
    ) {
      errors.push({
        field: "allowed_voucher_types",
        message: `allowed_voucher_types entries must not exceed ${PARTNER_FORM_CONFIG_LIMITS.maxVoucherTypeLength} characters`,
      });
    }
  }

  if (typeof input.intro_text !== "string") {
    errors.push({ field: "intro_text", message: "intro_text must be a string" });
  } else if (input.intro_text.length > PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength) {
    errors.push({
      field: "intro_text",
      message: `intro_text must not exceed ${PARTNER_FORM_CONFIG_LIMITS.maxIntroTextLength} characters`,
    });
  }

  if (!Array.isArray(input.rules_list)) {
    errors.push({ field: "rules_list", message: "rules_list must be an array of strings" });
  } else {
    if (input.rules_list.length > PARTNER_FORM_CONFIG_LIMITS.maxRules) {
      errors.push({
        field: "rules_list",
        message: `rules_list must not exceed ${PARTNER_FORM_CONFIG_LIMITS.maxRules} items`,
      });
    }
    if (input.rules_list.some((value) => typeof value !== "string")) {
      errors.push({
        field: "rules_list",
        message: "rules_list must contain only strings",
      });
    }
    if (
      input.rules_list.some(
        (value) =>
          typeof value === "string" && value.length > PARTNER_FORM_CONFIG_LIMITS.maxRuleLength,
      )
    ) {
      errors.push({
        field: "rules_list",
        message: `rules_list entries must not exceed ${PARTNER_FORM_CONFIG_LIMITS.maxRuleLength} characters`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalized = normalizePartnerFormConfig(input);
  const formatErrors = validateVoucherTypeFormat(normalized.allowed_voucher_types);
  if (formatErrors.length > 0) {
    return { ok: false, errors: formatErrors };
  }

  return { ok: true, value: normalized };
}
