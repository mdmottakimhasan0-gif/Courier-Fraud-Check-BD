import { Injectable } from "@nestjs/common";
import { ProviderFactory } from "../courier-providers/factory/provider-factory";
import { FraudResultAggregator } from "./aggregation/fraud-result.aggregator";
import { ConfidenceScoreCalculator } from "./confidence/confidence-score.calculator";
import type {
  FraudSearchRequest,
  FraudSearchResult,
  ProviderSearchOutcome
} from "./contracts/fraud-search.types";
import { SearchErrorCodeNormalizer } from "./errors/search-error-code.normalizer";
import { DataFreshnessResolver } from "./freshness/data-freshness.resolver";
import { resolveSearchStatus } from "./lifecycle/search-lifecycle";
import { RiskScoreCalculator } from "./risk/risk-score.calculator";
import { SearchTimingFactory } from "./timing/search-timing.factory";
import { BdPhoneNumberValidator } from "./validation/bd-phone-number.validator";
import { StaticProviderWeightStrategy } from "./weights/provider-weight.strategy";

@Injectable()
export class FraudSearchEngineService {
  constructor(
    private readonly phoneValidator: BdPhoneNumberValidator,
    private readonly providerFactory: ProviderFactory,
    private readonly aggregator: FraudResultAggregator,
    private readonly confidenceScoreCalculator: ConfidenceScoreCalculator,
    private readonly riskScoreCalculator: RiskScoreCalculator,
    private readonly errorCodeNormalizer: SearchErrorCodeNormalizer,
    private readonly freshnessResolver: DataFreshnessResolver,
    private readonly timingFactory: SearchTimingFactory,
    private readonly providerWeightStrategy: StaticProviderWeightStrategy
  ) {}

  async search(request: FraudSearchRequest): Promise<FraudSearchResult> {
    const startedAt = new Date();
    const normalizedPhone = this.phoneValidator.normalize(request.phoneNumber);
    const outcomes = await this.searchProviders({
      ...request,
      phoneNumber: normalizedPhone.local
    });
    const totals = this.aggregator.aggregate(outcomes);
    const confidence = this.confidenceScoreCalculator.calculate(outcomes);
    const risk = this.riskScoreCalculator.calculate(totals, outcomes, confidence);
    const finishedAt = new Date();
    const checkedAt = finishedAt.toISOString();

    return {
      checkedAt,
      confidence,
      correlationId: request.correlationId,
      dataFreshness: this.freshnessResolver.forSearch(outcomes, checkedAt),
      normalizedPhoneNumber: normalizedPhone.local,
      providerOutcomes: outcomes,
      risk,
      status: resolveSearchStatus(outcomes, false),
      timing: this.timingFactory.create(startedAt, finishedAt, outcomes),
      totals
    };
  }

  private async searchProviders(request: FraudSearchRequest): Promise<ProviderSearchOutcome[]> {
    const providers = this.providerFactory.list();
    const weights = this.providerWeightStrategy.getWeights();
    const settledResults = await Promise.allSettled(
      providers.map(async (provider) => {
        const startedAt = Date.now();
        const result = await provider.check(request);

        return {
          dataFreshness: this.freshnessResolver.forProvider(
            result.checkedAt,
            result.status === "available" ? "live" : "unavailable"
          ),
          latencyMs: Date.now() - startedAt,
          provider: provider.id,
          result,
          status: "fulfilled" as const,
          weight: weights[provider.id]
        };
      })
    );

    return settledResults.map((settledResult, index) => {
      if (settledResult.status === "fulfilled") {
        return settledResult.value;
      }

      const provider = providers[index];
      if (!provider) {
        throw new Error("Provider index mismatch during fraud search.");
      }

      return {
        errorCode: this.errorCodeNormalizer.normalize(settledResult.reason),
        errorMessage: this.resolveErrorMessage(settledResult.reason),
        latencyMs: 0,
        provider: provider.id,
        status: "rejected",
        weight: weights[provider.id]
      };
    });
  }

  private resolveErrorMessage(reason: unknown): string {
    if (reason instanceof Error) {
      return reason.message;
    }

    return "Courier provider failed unexpectedly.";
  }
}
