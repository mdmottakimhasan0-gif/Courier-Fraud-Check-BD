import type { CourierProviderId } from "./courier-provider.types";

export type ProviderHealthSnapshot = {
  averageResponseTimeMs?: number;
  circuitBreakerState: "closed" | "open" | "half-open";
  failureRate?: number;
  lastFailureAt?: string;
  lastSuccessfulRequestAt?: string;
  provider: CourierProviderId;
  status: "online" | "degraded" | "offline" | "unknown";
};

export interface ProviderHealthReporter {
  recordFailure(provider: CourierProviderId, occurredAt: Date): void;
  recordSuccess(provider: CourierProviderId, responseTimeMs: number, occurredAt: Date): void;
  snapshot(provider: CourierProviderId): ProviderHealthSnapshot;
}
