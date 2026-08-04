export type ApiResponse<TData = unknown, TMeta = unknown> = {
  correlationId: string;
  data: TData;
  message: string;
  meta: TMeta | null;
  success: true;
  timestamp: string;
};

export type ApiResponsePayload<TData = unknown, TMeta = unknown> = {
  data: TData;
  message?: string;
  meta?: TMeta;
};

export function apiResponse<TData, TMeta = unknown>(
  data: TData,
  message = "Request completed successfully.",
  meta?: TMeta
): ApiResponsePayload<TData, TMeta> {
  return {
    data,
    message,
    meta
  };
}
