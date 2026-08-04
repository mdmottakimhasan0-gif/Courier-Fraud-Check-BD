import type {
  CourierProviderId,
  CourierProviderResult
} from "../../courier-providers/contracts/courier-provider.types";

export type FraudSearchStatus = "queued" | "searching" | "partial" | "completed" | "failed" | "cached";

export type FraudRiskBadge = "low" | "medium" | "high" | "critical" | "unknown";

export type FraudSearchErrorCode =
  | "INVALID_PHONE_NUMBER"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_UNEXPECTED_ERROR"
  | "NO_PROVIDER_DATA";

export type FraudSearchRequest = {
  correlationId: string;
  phoneNumber: string;
  tenantId: string;
};

export type NormalizedPhoneNumber = {
  local: string;
};

export type ProviderSearchOutcome =
  | {
      dataFreshness: SearchDataFreshness;
      latencyMs: number;
      provider: CourierProviderId;
      result: CourierProviderResult;
      status: "fulfilled";
      weight: number;
    }
  | {
      errorCode: FraudSearchErrorCode;
      errorMessage: string;
      latencyMs: number;
      provider: CourierProviderId;
      status: "rejected";
      weight: number;
    };

export type FraudSearchTotals = {
  cancelRate: number;
  cancelledDeliveries: number;
  successRate: number;
  successfulDeliveries: number;
  totalDeliveries: number;
};

export type FraudSearchRisk = {
  badge: FraudRiskBadge;
  explanation: string;
  score: number;
};

export type FraudSearchConfidence = {
  availableProviderCount: number;
  score: number;
  totalProviderCount: number;
  weightedCoverage: number;
};

export type SearchDataFreshness = {
  ageSeconds: number;
  checkedAt: string;
  source: "live" | "cached" | "unavailable";
};

export type ProviderTimingMetric = {
  durationMs: number;
  provider: CourierProviderId;
};

export type SearchTimingMetrics = {
  durationMs: number;
  finishedAt: string;
  providerLatency: ProviderTimingMetric[];
  startedAt: string;
};

export type FraudSearchResult = {
  checkedAt: string;
  confidence: FraudSearchConfidence;
  correlationId: string;
  dataFreshness: SearchDataFreshness;
  normalizedPhoneNumber: string;
  providerOutcomes: ProviderSearchOutcome[];
  risk: FraudSearchRisk;
  status: FraudSearchStatus;
  timing: SearchTimingMetrics;
  totals: FraudSearchTotals;
};
