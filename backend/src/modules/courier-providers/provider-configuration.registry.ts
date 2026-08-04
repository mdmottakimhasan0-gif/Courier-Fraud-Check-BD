import { Injectable } from "@nestjs/common";
import type { CourierProviderId } from "./contracts/courier-provider.types";
import type {
  CourierProviderConfig,
  ProviderConfigurationRegistry
} from "./contracts/provider-config.interface";

const defaultProviderConfig = {
  circuitBreaker: {
    cooldownMs: 60_000,
    failureThreshold: 5,
    halfOpenProbeLimit: 1,
    rollingWindowMs: 300_000
  },
  retry: {
    backoffMs: 250,
    maxAttempts: 2
  },
  timeout: {
    connectTimeoutMs: 2_000,
    requestTimeoutMs: 8_000
  }
} as const;

@Injectable()
export class StaticProviderConfigurationRegistry implements ProviderConfigurationRegistry {
  getProviderConfig(provider: CourierProviderId): CourierProviderConfig {
    return {
      ...defaultProviderConfig,
      id: provider
    };
  }
}
