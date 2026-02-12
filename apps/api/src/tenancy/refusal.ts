import { REFUSAL_REASONS } from "@voucher-shyft/contracts";

// NOTE: Returns a JSON string, not an object, as a workaround for Fastify v5 return-path hang.
// Callers should use: reply.header("content-type", "application/json").send(refusal(...))
export function refusal(reason: string, correlationId: string) {
  return JSON.stringify({
    success: false,
    reason,
    correlation_id: correlationId,
  });
}

export const refusalReasons = {
  tenantNotFound: REFUSAL_REASONS.tenantNotFound,
  tenantContextMismatch: REFUSAL_REASONS.tenantContextMismatch,
  notAMember: REFUSAL_REASONS.notAMember,
  notAuthorizedForAction: REFUSAL_REASONS.notAuthorizedForAction,
  partnerTokenInvalid: REFUSAL_REASONS.partnerTokenInvalid,
  partnerTokenScope: REFUSAL_REASONS.partnerTokenScope,
  duplicateInPolicyWindow: REFUSAL_REASONS.duplicateInPolicyWindow,
  duplicateWarningRequiresOverride: REFUSAL_REASONS.duplicateWarningRequiresOverride,
} as const;
