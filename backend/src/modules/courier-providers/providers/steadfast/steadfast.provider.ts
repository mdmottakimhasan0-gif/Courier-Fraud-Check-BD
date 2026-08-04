import { Inject, Injectable } from "@nestjs/common";
import type { ProviderConfigurationRegistry } from "../../contracts/provider-config.interface";
import type { ProviderHealthReporter } from "../../contracts/provider-health.interface";
import type { ProviderHttpClient } from "../../contracts/http-client.interface";
import { DefaultProviderErrorNormalizer } from "../../errors/provider-error-normalizer";
import { PROVIDER_CONFIGURATION_REGISTRY, PROVIDER_HEALTH_REPORTER, PROVIDER_HTTP_CLIENT } from "../../provider.tokens";
import { ProviderCircuitBreaker } from "../../resilience/circuit-breaker";
import { ProviderRetryExecutor } from "../../resilience/provider-retry.executor";
import { StandardProviderResponseNormalizer } from "../../normalizers/standard-provider-response.normalizer";
import { BaseProviderAdapter } from "../base-provider.adapter";

type SteadfastRawMetrics = {
  cancelledDeliveries: number;
  successfulDeliveries: number;
};

@Injectable()
export class SteadfastProviderAdapter extends BaseProviderAdapter<SteadfastRawMetrics> {
  readonly id = "steadfast" as const;

  constructor(
    @Inject(PROVIDER_CONFIGURATION_REGISTRY) configurationRegistry: ProviderConfigurationRegistry,
    circuitBreaker: ProviderCircuitBreaker,
    retryExecutor: ProviderRetryExecutor,
    @Inject(PROVIDER_HEALTH_REPORTER) healthReporter: ProviderHealthReporter,
    @Inject(PROVIDER_HTTP_CLIENT) httpClient: ProviderHttpClient,
    responseNormalizer: StandardProviderResponseNormalizer<SteadfastRawMetrics>,
    errorNormalizer: DefaultProviderErrorNormalizer
  ) {
    super(
      configurationRegistry,
      circuitBreaker,
      retryExecutor,
      healthReporter,
      httpClient,
      responseNormalizer,
      errorNormalizer
    );
  }

  protected executeProviderRequest(): Promise<SteadfastRawMetrics> {
    throw new Error("Steadfast provider execution will be implemented with merchant credentials in the approved integration step.");
  }
}
