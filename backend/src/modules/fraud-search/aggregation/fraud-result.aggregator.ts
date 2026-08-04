import { Injectable } from "@nestjs/common";
import type {
  FraudSearchTotals,
  ProviderSearchOutcome
} from "../contracts/fraud-search.types";

function percentage(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

@Injectable()
export class FraudResultAggregator {
  aggregate(outcomes: ProviderSearchOutcome[]): FraudSearchTotals {
    const availableResults = outcomes
      .filter((outcome) => outcome.status === "fulfilled")
      .map((outcome) => outcome.result)
      .filter((result) => result.status === "available");

    const successfulDeliveries = availableResults.reduce(
      (total, result) => total + result.metrics.successfulDeliveries,
      0
    );
    const cancelledDeliveries = availableResults.reduce(
      (total, result) => total + result.metrics.cancelledDeliveries,
      0
    );
    const totalDeliveries = successfulDeliveries + cancelledDeliveries;

    return {
      cancelRate: percentage(cancelledDeliveries, totalDeliveries),
      cancelledDeliveries,
      successRate: percentage(successfulDeliveries, totalDeliveries),
      successfulDeliveries,
      totalDeliveries
    };
  }
}
