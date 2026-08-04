import type { CourierProviderId } from "../contracts/courier-provider.types";

export type ProviderHealthDto = {
  averageResponseTimeMs?: number;
  circuitBreakerState: "closed" | "open" | "half-open";
  failureRate?: number;
  lastFailureAt?: string;
  lastSuccessfulRequestAt?: string;
  provider: CourierProviderId;
  status: "online" | "degraded" | "offline" | "unknown";
};
