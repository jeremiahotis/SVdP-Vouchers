export const REFUSAL_REASONS = {
  tenantNotFound: "TENANT_NOT_FOUND",
  tenantContextMismatch: "TENANT_CONTEXT_MISMATCH",
  notAMember: "NOT_A_MEMBER",
} as const;

export type RefusalReason = typeof REFUSAL_REASONS[keyof typeof REFUSAL_REASONS];
