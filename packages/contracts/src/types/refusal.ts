import type { RefusalReason } from "../constants/refusal-reasons.js";

export type RefusalResponse = {
  success: false;
  reason: RefusalReason;
  correlation_id: string;
  details?: Record<string, unknown>;
};
