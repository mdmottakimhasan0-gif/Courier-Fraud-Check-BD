import type { CourierMetricSet, CourierRiskSignal } from "../contracts/courier-provider.types";

export type DeliveryCountInput = {
  cancelledDeliveries: number;
  successfulDeliveries: number;
  totalOrders?: number;
};

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

function percentage(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

export function normalizeDeliveryMetrics(input: DeliveryCountInput): CourierMetricSet {
  const successfulDeliveries = nonNegativeInteger(input.successfulDeliveries);
  const cancelledDeliveries = nonNegativeInteger(input.cancelledDeliveries);
  const providedTotal = input.totalOrders === undefined ? undefined : nonNegativeInteger(input.totalOrders);
  const totalOrders = providedTotal ?? successfulDeliveries + cancelledDeliveries;
  const adjustedCancelled = Math.max(cancelledDeliveries, totalOrders - successfulDeliveries);

  return {
    cancelledDeliveries: adjustedCancelled,
    returnRate: percentage(adjustedCancelled, totalOrders),
    successfulDeliveries,
    successRate: percentage(successfulDeliveries, totalOrders),
    totalOrders
  };
}

export function classifyRisk(metrics: CourierMetricSet): CourierRiskSignal {
  if (metrics.totalOrders === 0) {
    return "unknown";
  }

  if (metrics.returnRate >= 60) {
    return "high";
  }

  if (metrics.returnRate >= 30) {
    return "medium";
  }

  return "low";
}
