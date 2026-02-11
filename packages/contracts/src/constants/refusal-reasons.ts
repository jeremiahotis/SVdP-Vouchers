export const REFUSAL_REASONS = {
  tenantNotFound: "TENANT_NOT_FOUND",
  tenantContextMismatch: "TENANT_CONTEXT_MISMATCH",
  notAMember: "NOT_A_MEMBER",
  notAuthorizedForAction: "NOT_AUTHORIZED_FOR_ACTION",
  partnerTokenInvalid: "PARTNER_TOKEN_INVALID",
  partnerTokenScope: "PARTNER_TOKEN_SCOPE",
} as const;

export type RefusalReason = typeof REFUSAL_REASONS[keyof typeof REFUSAL_REASONS];
