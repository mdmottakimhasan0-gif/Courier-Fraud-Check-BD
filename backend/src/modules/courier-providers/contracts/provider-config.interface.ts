import type { CourierProviderId } from "./courier-provider.types";

export type ProviderTimeoutPolicy = {
  connectTimeoutMs: number;
  requestTimeoutMs: number;
};

export type ProviderRetryPolicy = {
  backoffMs: number;
  maxAttempts: number;
};

export type ProviderCircuitBreakerPolicy = {
  cooldownMs: number;
  failureThreshold: number;
  halfOpenProbeLimit: number;
  rollingWindowMs: number;
};

export type CourierProviderConfig = {
  circuitBreaker: ProviderCircuitBreakerPolicy;
  id: CourierProviderId;
  retry: ProviderRetryPolicy;
  timeout: ProviderTimeoutPolicy;
};

export interface ProviderConfigurationRegistry {
  getProviderConfig(provider: CourierProviderId): CourierProviderConfig;
}
