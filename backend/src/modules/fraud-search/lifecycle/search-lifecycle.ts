import type { FraudSearchStatus, ProviderSearchOutcome } from "../contracts/fraud-search.types";

export function resolveSearchStatus(
  outcomes: ProviderSearchOutcome[],
  cacheHit: boolean
): FraudSearchStatus {
  if (cacheHit) {
    return "cached";
  }

  if (outcomes.length === 0) {
    return "failed";
  }

  const fulfilled = outcomes.filter((outcome) => outcome.status === "fulfilled");
  const available = fulfilled.filter((outcome) => outcome.result.status === "available");

  if (available.length === outcomes.length) {
    return "completed";
  }

  if (available.length > 0) {
    return "partial";
  }

  return "failed";
}
