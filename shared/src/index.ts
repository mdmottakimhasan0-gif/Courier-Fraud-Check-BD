export const PRODUCT_NAME = "Courier Fraud Check BD";

export const API_VERSION = "v1";

export type SupportedLocale = "en" | "bn";

export type ApiEnvelope<TData> = {
  data: TData;
  meta: {
    correlationId?: string;
    version: typeof API_VERSION;
  };
};

export function createApiEnvelope<TData>(data: TData, correlationId?: string): ApiEnvelope<TData> {
  return {
    data,
    meta: {
      correlationId,
      version: API_VERSION
    }
  };
}
