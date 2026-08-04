import type {
  CourierProviderId,
  CourierProviderResult
} from "../contracts/courier-provider.types";
import type { ProviderResponseNormalizer } from "../contracts/provider-normalizer.interface";
import {
  classifyRisk,
  normalizeDeliveryMetrics,
  type DeliveryCountInput
} from "./delivery-metrics.normalizer";

export class StandardProviderResponseNormalizer<TRaw extends DeliveryCountInput>
  implements ProviderResponseNormalizer<TRaw>
{
  normalize(raw: TRaw, provider: CourierProviderId, responseTimeMs: number): CourierProviderResult {
    const metrics = normalizeDeliveryMetrics(raw);

    return {
      checkedAt: new Date().toISOString(),
      metrics,
      provider,
      responseTimeMs,
      riskSignal: classifyRisk(metrics),
      status: "available"
    };
  }
}
