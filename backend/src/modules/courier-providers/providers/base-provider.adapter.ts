import type { CourierProvider } from "../contracts/courier-provider.interface";
import type {
  CourierCheckRequest,
  CourierProviderId,
  CourierProviderResult
} from "../contracts/courier-provider.types";
import type { ProviderConfigurationRegistry } from "../contracts/provider-config.interface";
import type { ProviderHealthReporter } from "../contracts/provider-health.interface";
import type { ProviderHttpClient } from "../contracts/http-client.interface";
import type { ProviderErrorNormalizer, ProviderResponseNormalizer } from "../contracts/provider-normalizer.interface";
import { ProviderCircuitBreaker } from "../resilience/circuit-breaker";
import { ProviderRetryExecutor } from "../resilience/provider-retry.executor";

type ProviderRawRequest = {
  phoneNumber: string;
  tenantId: string;
  timeoutMs: number;
};

export abstract class BaseProviderAdapter<TRaw> implements CourierProvider {
  abstract readonly id: CourierProviderId;

  protected constructor(
    private readonly configurationRegistry: ProviderConfigurationRegistry,
    private readonly circuitBreaker: ProviderCircuitBreaker,
    private readonly retryExecutor: ProviderRetryExecutor,
    private readonly healthReporter: ProviderHealthReporter,
    protected readonly httpClient: ProviderHttpClient,
    private readonly responseNormalizer: ProviderResponseNormalizer<TRaw>,
    private readonly errorNormalizer: ProviderErrorNormalizer
  ) {}

  async check(request: CourierCheckRequest): Promise<CourierProviderResult> {
    const config = this.configurationRegistry.getProviderConfig(this.id);
    const startedAt = Date.now();

    if (!this.circuitBreaker.canRequest(this.id, config.circuitBreaker)) {
      return this.unavailableResult("Provider circuit breaker is open.", startedAt);
    }

    this.circuitBreaker.recordProbe(this.id);

    try {
      const raw = await this.retryExecutor.run(
        () =>
          this.executeProviderRequest({
            phoneNumber: request.phoneNumber,
            tenantId: request.tenantId,
            timeoutMs: config.timeout.requestTimeoutMs
          }),
        config.retry
      );
      const responseTimeMs = Date.now() - startedAt;
      this.circuitBreaker.recordSuccess(this.id);
      this.healthReporter.recordSuccess(this.id, responseTimeMs, new Date());

      return this.responseNormalizer.normalize(raw, this.id, responseTimeMs);
    } catch (error) {
      const normalized = this.errorNormalizer.normalize(error, this.id);
      this.circuitBreaker.recordFailure(this.id, config.circuitBreaker);
      this.healthReporter.recordFailure(this.id, new Date());

      return this.unavailableResult(normalized.message, startedAt);
    }
  }

  protected abstract executeProviderRequest(request: ProviderRawRequest): Promise<TRaw>;

  private unavailableResult(reason: string, startedAt: number): CourierProviderResult {
    return {
      checkedAt: new Date().toISOString(),
      metrics: {
        cancelledDeliveries: 0,
        returnRate: 0,
        successfulDeliveries: 0,
        successRate: 0,
        totalOrders: 0
      },
      provider: this.id,
      responseTimeMs: Date.now() - startedAt,
      riskSignal: "unknown",
      status: "unavailable",
      unavailableReason: reason
    };
  }
}
