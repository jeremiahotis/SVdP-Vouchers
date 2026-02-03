import type { RefusalResponse } from "@voucher-shyft/contracts";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  correlation_id: string;
};

export type ApiErrorResponse = {
  success: false;
  error: { code: string; message: string };
  correlation_id: string;
};

export type ApiResponse<T> = ApiSuccess<T> | RefusalResponse | ApiErrorResponse;

export function isRefusal<T>(response: ApiResponse<T>): response is RefusalResponse {
  return response.success === false && "reason" in response;
}

export function isError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false && "error" in response;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const payload = (await res.json()) as ApiResponse<T>;

  if (!res.ok && !isError(payload)) {
    return {
      success: false,
      error: { code: "HTTP_ERROR", message: `HTTP ${res.status}` },
      correlation_id: "unknown",
    };
  }

  return payload;
}
