import type {
  CourierProviderFailure,
  CourierProviderId,
  CourierProviderResult
} from "./courier-provider.types";

export interface ProviderResponseNormalizer<TRaw> {
  normalize(raw: TRaw, provider: CourierProviderId, responseTimeMs: number): CourierProviderResult;
}

export interface ProviderErrorNormalizer {
  normalize(error: unknown, provider: CourierProviderId): CourierProviderFailure;
}
