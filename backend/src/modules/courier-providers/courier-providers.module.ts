import { Module } from "@nestjs/common";
import { DefaultProviderErrorNormalizer } from "./errors/provider-error-normalizer";
import { ProviderFactory } from "./factory/provider-factory";
import { InMemoryProviderHealthReporter } from "./health/in-memory-provider-health.reporter";
import { FetchProviderHttpClient } from "./http/fetch-provider-http.client";
import { StandardProviderResponseNormalizer } from "./normalizers/standard-provider-response.normalizer";
import { PathaoProviderAdapter } from "./providers/pathao/pathao.provider";
import { RedxProviderAdapter } from "./providers/redx/redx.provider";
import { SteadfastProviderAdapter } from "./providers/steadfast/steadfast.provider";
import { StaticProviderConfigurationRegistry } from "./provider-configuration.registry";
import {
  COURIER_PROVIDER_COLLECTION,
  PROVIDER_CONFIGURATION_REGISTRY,
  PROVIDER_HEALTH_REPORTER,
  PROVIDER_HTTP_CLIENT
} from "./provider.tokens";
import { ProviderCircuitBreaker } from "./resilience/circuit-breaker";
import { ProviderRetryExecutor } from "./resilience/provider-retry.executor";

@Module({
  providers: [
    ProviderCircuitBreaker,
    ProviderRetryExecutor,
    DefaultProviderErrorNormalizer,
    StandardProviderResponseNormalizer,
    SteadfastProviderAdapter,
    PathaoProviderAdapter,
    RedxProviderAdapter,
    {
      provide: PROVIDER_CONFIGURATION_REGISTRY,
      useClass: StaticProviderConfigurationRegistry
    },
    {
      provide: PROVIDER_HTTP_CLIENT,
      useClass: FetchProviderHttpClient
    },
    {
      provide: PROVIDER_HEALTH_REPORTER,
      useClass: InMemoryProviderHealthReporter
    },
    {
      provide: COURIER_PROVIDER_COLLECTION,
      useFactory: (
        steadfastProvider: SteadfastProviderAdapter,
        pathaoProvider: PathaoProviderAdapter,
        redxProvider: RedxProviderAdapter
      ) => [steadfastProvider, pathaoProvider, redxProvider],
      inject: [SteadfastProviderAdapter, PathaoProviderAdapter, RedxProviderAdapter]
    },
    ProviderFactory
  ],
  exports: [ProviderFactory, PROVIDER_HEALTH_REPORTER]
})
export class CourierProvidersModule {}
