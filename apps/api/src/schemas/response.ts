export const refusalSchema = {
  type: "object",
  properties: {
    success: { const: false },
    reason: { type: "string" },
    details: { type: "object", additionalProperties: true, nullable: true },
    correlation_id: { type: "string" },
  },
  required: ["success", "reason", "correlation_id"],
} as const;

export const errorSchema = {
  type: "object",
  properties: {
    success: { const: false },
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
      required: ["code", "message"],
    },
    correlation_id: { type: "string" },
  },
  required: ["success", "error", "correlation_id"],
} as const;

export function successSchema(dataSchema: Record<string, unknown>) {
  return {
    type: "object",
    properties: {
      success: { const: true },
      data: dataSchema,
      correlation_id: { type: "string" },
    },
    required: ["success", "data", "correlation_id"],
  } as const;
}

export function successOrRefusalSchema(dataSchema: Record<string, unknown>) {
  return {
    oneOf: [successSchema(dataSchema), refusalSchema],
  } as const;
}
