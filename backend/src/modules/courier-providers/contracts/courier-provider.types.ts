export const COURIER_PROVIDER_IDS = ["steadfast", "pathao", "redx"] as const;

export type CourierProviderId = (typeof COURIER_PROVIDER_IDS)[number];

export type CourierProviderStatus = "available" | "degraded" | "unavailable" | "skipped";

export type CourierRiskSignal = "low" | "medium" | "high" | "unknown";

export type CourierCheckRequest = {
  phoneNumber: string;
  tenantId: string;
  correlationId: string;
};

export type CourierMetricSet = {
  cancelledDeliveries: number;
  returnRate: number;
  successfulDeliveries: number;
  successRate: number;
  totalOrders: number;
};

export type CourierProviderResult = {
  checkedAt: string;
  metrics: CourierMetricSet;
  provider: CourierProviderId;
  responseTimeMs: number;
  riskSignal: CourierRiskSignal;
  status: CourierProviderStatus;
  unavailableReason?: string;
};

export type CourierProviderFailure = {
  code: string;
  message: string;
  provider: CourierProviderId;
  retryable: boolean;
};
