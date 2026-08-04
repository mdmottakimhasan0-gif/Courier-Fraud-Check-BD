import type {
  FraudSearchConfidence,
  FraudSearchRisk,
  FraudSearchTotals,
  ProviderSearchOutcome
} from "../contracts/fraud-search.types";

export interface RiskCalculatorStrategy {
  calculate(
    totals: FraudSearchTotals,
    outcomes: ProviderSearchOutcome[],
    confidence: FraudSearchConfidence
  ): FraudSearchRisk;
}
