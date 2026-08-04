import { describe, expect, it } from "vitest";
import type { CourierProvider } from "../courier-providers/contracts/courier-provider.interface";
import type { CourierProviderId, CourierProviderResult } from "../courier-providers/contracts/courier-provider.types";
import { ProviderFactory } from "../courier-providers/factory/provider-factory";
import { FraudResultAggregator } from "./aggregation/fraud-result.aggregator";
import { ConfidenceScoreCalculator } from "./confidence/confidence-score.calculator";
import type { ProviderSearchOutcome } from "./contracts/fraud-search.types";
import { SearchErrorCodeNormalizer } from "./errors/search-error-code.normalizer";
import { DataFreshnessResolver } from "./freshness/data-freshness.resolver";
import { FraudSearchEngineService } from "./fraud-search-engine.service";
import { resolveSearchStatus } from "./lifecycle/search-lifecycle";
import { RiskScoreCalculator } from "./risk/risk-score.calculator";
import { SearchTimingFactory } from "./timing/search-timing.factory";
import { BdPhoneNumberValidator } from "./validation/bd-phone-number.validator";
import { StaticProviderWeightStrategy } from "./weights/provider-weight.strategy";

function result(provider: CourierProviderId, successfulDeliveries: number, cancelledDeliveries: number): CourierProviderResult {
  const totalOrders = successfulDeliveries + cancelledDeliveries;
  return {
    checkedAt: "2026-08-04T06:00:00.000Z",
    metrics: {
      cancelledDeliveries,
      returnRate: totalOrders === 0 ? 0 : (cancelledDeliveries / totalOrders) * 100,
      successfulDeliveries,
      successRate: totalOrders === 0 ? 0 : (successfulDeliveries / totalOrders) * 100,
      totalOrders
    },
    provider,
    responseTimeMs: 50,
    riskSignal: "medium",
    status: "available"
  };
}

function fulfilled(provider: CourierProviderId, successful: number, cancelled: number, weight = 1): ProviderSearchOutcome {
  return {
    dataFreshness: { ageSeconds: 0, checkedAt: "2026-08-04T06:00:00.000Z", source: "live" },
    latencyMs: 25,
    provider,
    result: result(provider, successful, cancelled),
    status: "fulfilled",
    weight
  };
}

describe("Fraud Search testing architecture", () => {
  it("normalizes Bangladeshi phone numbers and rejects invalid input", () => {
    const validator = new BdPhoneNumberValidator();

    expect(validator.normalize("+8801712345678").local).toBe("01712345678");
    expect(validator.normalize("01712-345 678").local).toBe("01712345678");
    expect(() => validator.normalize("0212345678")).toThrow("Bangladeshi mobile");
  });

  it("aggregates provider responses and calculates risk and confidence", () => {
    const outcomes = [fulfilled("steadfast", 80, 20, 2), fulfilled("pathao", 30, 20, 1)];
    const totals = new FraudResultAggregator().aggregate(outcomes);
    const confidence = new ConfidenceScoreCalculator().calculate(outcomes);
    const risk = new RiskScoreCalculator().calculate(totals, outcomes, confidence);

    expect(totals).toEqual({
      cancelRate: 26.67,
      cancelledDeliveries: 40,
      successRate: 73.33,
      successfulDeliveries: 110,
      totalDeliveries: 150
    });
    expect(confidence).toMatchObject({ availableProviderCount: 2, score: 100, totalProviderCount: 2 });
    expect(risk.badge).toBe("low");
    expect(risk.score).toBe(28);
    expect(risk.explanation).toContain("cancel rate");
  });

  it("resolves completed, partial, failed, and cached lifecycle states", () => {
    const rejected: ProviderSearchOutcome = {
      errorCode: "PROVIDER_TIMEOUT",
      errorMessage: "timeout",
      latencyMs: 0,
      provider: "redx",
      status: "rejected",
      weight: 1
    };

    expect(resolveSearchStatus([fulfilled("steadfast", 1, 0)], false)).toBe("completed");
    expect(resolveSearchStatus([fulfilled("steadfast", 1, 0), rejected], false)).toBe("partial");
    expect(resolveSearchStatus([rejected], false)).toBe("failed");
    expect(resolveSearchStatus([], true)).toBe("cached");
  });

  it("executes providers with Promise.allSettled semantics and keeps partial failures isolated", async () => {
    const providers: CourierProvider[] = [
      {
        id: "steadfast",
        check: async () => result("steadfast", 12, 3)
      },
      {
        id: "pathao",
        check: async () => {
          throw new Error("provider timeout");
        }
      }
    ];
    const service = new FraudSearchEngineService(
      new BdPhoneNumberValidator(),
      new ProviderFactory(providers),
      new FraudResultAggregator(),
      new ConfidenceScoreCalculator(),
      new RiskScoreCalculator(),
      new SearchErrorCodeNormalizer(),
      new DataFreshnessResolver(),
      new SearchTimingFactory(),
      new StaticProviderWeightStrategy()
    );

    const searchResult = await service.search({
      correlationId: "corr-123",
      phoneNumber: "01712345678",
      tenantId: "tenant-1"
    });

    expect(searchResult.status).toBe("partial");
    expect(searchResult.providerOutcomes).toHaveLength(2);
    expect(searchResult.providerOutcomes.some((outcome) => outcome.status === "rejected")).toBe(true);
    expect(searchResult.correlationId).toBe("corr-123");
    expect(searchResult.totals.totalDeliveries).toBe(15);
  });
});
