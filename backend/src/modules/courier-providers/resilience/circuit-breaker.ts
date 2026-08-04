import { Injectable } from "@nestjs/common";
import type { CourierProviderId } from "../contracts/courier-provider.types";
import type { ProviderCircuitBreakerPolicy } from "../contracts/provider-config.interface";

export type CircuitState = "closed" | "open" | "half-open";

type CircuitRecord = {
  failureCount: number;
  lastOpenedAt?: number;
  probeCount: number;
  state: CircuitState;
};

@Injectable()
export class ProviderCircuitBreaker {
  private readonly records = new Map<CourierProviderId, CircuitRecord>();

  canRequest(provider: CourierProviderId, policy: ProviderCircuitBreakerPolicy, now = Date.now()): boolean {
    const record = this.getRecord(provider);
    if (record.state === "closed") {
      return true;
    }

    if (record.state === "open") {
      const openedAt = record.lastOpenedAt ?? now;
      if (now - openedAt >= policy.cooldownMs) {
        record.state = "half-open";
        record.probeCount = 0;
        return true;
      }

      return false;
    }

    return record.probeCount < policy.halfOpenProbeLimit;
  }

  recordFailure(provider: CourierProviderId, policy: ProviderCircuitBreakerPolicy): void {
    const record = this.getRecord(provider);
    record.failureCount += 1;

    if (record.failureCount >= policy.failureThreshold || record.state === "half-open") {
      record.state = "open";
      record.lastOpenedAt = Date.now();
      record.probeCount = 0;
    }
  }

  recordSuccess(provider: CourierProviderId): void {
    const record = this.getRecord(provider);
    record.failureCount = 0;
    record.state = "closed";
    record.probeCount = 0;
    record.lastOpenedAt = undefined;
  }

  recordProbe(provider: CourierProviderId): void {
    const record = this.getRecord(provider);
    if (record.state === "half-open") {
      record.probeCount += 1;
    }
  }

  state(provider: CourierProviderId): CircuitState {
    return this.getRecord(provider).state;
  }

  private getRecord(provider: CourierProviderId): CircuitRecord {
    const existing = this.records.get(provider);
    if (existing) {
      return existing;
    }

    const record: CircuitRecord = {
      failureCount: 0,
      probeCount: 0,
      state: "closed"
    };
    this.records.set(provider, record);
    return record;
  }
}
