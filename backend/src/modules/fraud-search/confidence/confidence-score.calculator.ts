import { Injectable } from "@nestjs/common";
import type { FraudSearchConfidence, ProviderSearchOutcome } from "../contracts/fraud-search.types";

@Injectable()
export class ConfidenceScoreCalculator {
  calculate(outcomes: ProviderSearchOutcome[]): FraudSearchConfidence {
    const totalWeight = outcomes.reduce((total, outcome) => total + outcome.weight, 0);
    const availableOutcomes = outcomes.filter(
      (outcome) => outcome.status === "fulfilled" && outcome.result.status === "available"
    );
    const availableWeight = availableOutcomes.reduce((total, outcome) => total + outcome.weight, 0);
    const weightedCoverage = totalWeight === 0 ? 0 : Number(((availableWeight / totalWeight) * 100).toFixed(2));

    return {
      availableProviderCount: availableOutcomes.length,
      score: Math.round(weightedCoverage),
      totalProviderCount: outcomes.length,
      weightedCoverage
    };
  }
}
