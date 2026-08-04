import { Injectable } from "@nestjs/common";
import type {
  FraudSearchConfidence,
  FraudRiskBadge,
  FraudSearchRisk,
  FraudSearchTotals,
  ProviderSearchOutcome
} from "../contracts/fraud-search.types";
import type { RiskCalculatorStrategy } from "./risk-calculator.strategy";

@Injectable()
export class RiskScoreCalculator implements RiskCalculatorStrategy {
  calculate(
    totals: FraudSearchTotals,
    outcomes: ProviderSearchOutcome[],
    confidence: FraudSearchConfidence
  ): FraudSearchRisk {
    if (totals.totalDeliveries === 0) {
      return {
        badge: "unknown",
        explanation: "No available courier delivery data was returned, so risk cannot be confidently estimated.",
        score: 0
      };
    }

    const unavailableProviderCount = outcomes.filter((outcome) => {
      if (outcome.status === "rejected") {
        return true;
      }

      return outcome.result.status !== "available";
    }).length;
    const volumeConfidence = this.volumeConfidence(totals.totalDeliveries);
    const providerPenalty = Math.min(15, unavailableProviderCount * 5);
    const lowConfidencePenalty = confidence.score < 70 ? 5 : 0;
    const score = Math.min(
      100,
      Math.round(totals.cancelRate * 0.85 + providerPenalty + volumeConfidence + lowConfidencePenalty)
    );
    const badge = this.toBadge(score);

    return {
      badge,
      explanation: this.explain(score, badge, totals, confidence, unavailableProviderCount),
      score
    };
  }

  private explain(
    score: number,
    badge: FraudRiskBadge,
    totals: FraudSearchTotals,
    confidence: FraudSearchConfidence,
    unavailableProviderCount: number
  ): string {
    return `Risk is ${badge} with score ${score}. The cancel rate is ${totals.cancelRate}% across ${totals.totalDeliveries} deliveries, with ${confidence.availableProviderCount}/${confidence.totalProviderCount} providers available and ${unavailableProviderCount} provider issue(s).`;
  }

  private toBadge(score: number): FraudRiskBadge {
    if (score >= 80) {
      return "critical";
    }

    if (score >= 60) {
      return "high";
    }

    if (score >= 30) {
      return "medium";
    }

    return "low";
  }

  private volumeConfidence(totalDeliveries: number): number {
    if (totalDeliveries >= 50) {
      return 5;
    }

    if (totalDeliveries >= 10) {
      return 2;
    }

    return 0;
  }
}
