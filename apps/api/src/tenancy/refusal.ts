import { REFUSAL_REASONS } from "@voucher-shyft/contracts";

export function refusal(reason: string, correlationId: string) {
  return {
    success: false,
    reason,
    correlation_id: correlationId,
  };
}

export const refusalReasons = {
  tenantNotFound: REFUSAL_REASONS.tenantNotFound,
  tenantContextMismatch: REFUSAL_REASONS.tenantContextMismatch,
} as const;
