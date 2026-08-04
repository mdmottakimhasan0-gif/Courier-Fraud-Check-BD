import { describe, expect, it } from "vitest";
import { DefaultProviderErrorNormalizer } from "./errors/provider-error-normalizer";
import { ProviderFactory } from "./factory/provider-factory";
import { classifyRisk, normalizeDeliveryMetrics } from "./normalizers/delivery-metrics.normalizer";
import { ProviderCircuitBreaker } from "./resilience/circuit-breaker";
import { withProviderTimeout } from "./resilience/provider-timeout";

describe("Courier provider adapter validation", () => {
  it("normalizes delivery metrics and risk signals", () => {
    const metrics = normalizeDeliveryMetrics({ cancelledDeliveries: 3, successfulDeliveries: 7 });

    expect(metrics).toMatchObject({ returnRate: 30, successRate: 70, totalOrders: 10 });
    expect(classifyRisk(metrics)).toBe("medium");
  });

  it("normalizes provider errors into retry-aware failures", () => {
    const normalizer = new DefaultProviderErrorNormalizer();

    expect(normalizer.normalize({ statusCode: 429, message: "slow down" }, "pathao")).toMatchObject({
      code: "PROVIDER_RATE_LIMITED",
      provider: "pathao",
      retryable: true
    });
    expect(normalizer.normalize({ statusCode: 401 }, "redx")).toMatchObject({
      code: "PROVIDER_AUTH_FAILED",
      retryable: false
    });
  });

  it("keeps provider registry isolated by provider id", () => {
    const provider = { id: "steadfast" as const, check: async () => Promise.reject(new Error("unused")) };
    const factory = new ProviderFactory([provider]);

    expect(factory.get("steadfast")).toBe(provider);
    expect(() => factory.get("pathao")).toThrow("not registered");
  });

  it("opens and recovers circuit breaker state according to policy", () => {
    const breaker = new ProviderCircuitBreaker();
    const policy = { cooldownMs: 1000, failureThreshold: 2, halfOpenProbeLimit: 1, rollingWindowMs: 60_000 };

    breaker.recordFailure("redx", policy);
    expect(breaker.state("redx")).toBe("closed");
    breaker.recordFailure("redx", policy);
    expect(breaker.state("redx")).toBe("open");
    expect(breaker.canRequest("redx", policy, Date.now())).toBe(false);
    expect(breaker.canRequest("redx", policy, Date.now() + 1001)).toBe(true);
    breaker.recordSuccess("redx");
    expect(breaker.state("redx")).toBe("closed");
  });

  it("enforces provider timeout boundaries", async () => {
    await expect(withProviderTimeout(new Promise((resolve) => setTimeout(resolve, 25)), 1)).rejects.toThrow(
      "timeout"
    );
    await expect(withProviderTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });
});
