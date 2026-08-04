import { Injectable } from "@nestjs/common";
import type { CourierProviderId } from "../contracts/courier-provider.types";
import type {
  ProviderHealthReporter,
  ProviderHealthSnapshot
} from "../contracts/provider-health.interface";
import { ProviderCircuitBreaker } from "../resilience/circuit-breaker";

type HealthRecord = {
  failureCount: number;
  lastFailureAt?: string;
  lastSuccessfulRequestAt?: string;
  responseTimes: number[];
  successCount: number;
};

@Injectable()
export class InMemoryProviderHealthReporter implements ProviderHealthReporter {
  private readonly records = new Map<CourierProviderId, HealthRecord>();

  constructor(private readonly circuitBreaker: ProviderCircuitBreaker) {}

  recordFailure(provider: CourierProviderId, occurredAt: Date): void {
    const record = this.getRecord(provider);
    record.failureCount += 1;
    record.lastFailureAt = occurredAt.toISOString();
  }

  recordSuccess(provider: CourierProviderId, responseTimeMs: number, occurredAt: Date): void {
    const record = this.getRecord(provider);
    record.successCount += 1;
    record.responseTimes = [...record.responseTimes.slice(-49), responseTimeMs];
    record.lastSuccessfulRequestAt = occurredAt.toISOString();
  }

  snapshot(provider: CourierProviderId): ProviderHealthSnapshot {
    const record = this.getRecord(provider);
    const total = record.failureCount + record.successCount;
    const failureRate = total === 0 ? undefined : Number(((record.failureCount / total) * 100).toFixed(2));
    const averageResponseTimeMs =
      record.responseTimes.length === 0
        ? undefined
        : Math.round(record.responseTimes.reduce((totalMs, value) => totalMs + value, 0) / record.responseTimes.length);
    const circuitBreakerState = this.circuitBreaker.state(provider);

    return {
      averageResponseTimeMs,
      circuitBreakerState,
      failureRate,
      lastFailureAt: record.lastFailureAt,
      lastSuccessfulRequestAt: record.lastSuccessfulRequestAt,
      provider,
      status: this.resolveStatus(circuitBreakerState, failureRate)
    };
  }

  private getRecord(provider: CourierProviderId): HealthRecord {
    const existing = this.records.get(provider);
    if (existing) {
      return existing;
    }

    const record: HealthRecord = {
      failureCount: 0,
      responseTimes: [],
      successCount: 0
    };
    this.records.set(provider, record);
    return record;
  }

  private resolveStatus(
    circuitBreakerState: ProviderHealthSnapshot["circuitBreakerState"],
    failureRate: number | undefined
  ): ProviderHealthSnapshot["status"] {
    if (circuitBreakerState === "open") {
      return "offline";
    }

    if (circuitBreakerState === "half-open" || (failureRate !== undefined && failureRate >= 25)) {
      return "degraded";
    }

    return failureRate === undefined ? "unknown" : "online";
  }
}
