import type {
  CourierProviderFailure,
  CourierProviderId
} from "../contracts/courier-provider.types";
import type { ProviderErrorNormalizer } from "../contracts/provider-normalizer.interface";

type ErrorLike = {
  code?: string;
  message?: string;
  statusCode?: number;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

export class DefaultProviderErrorNormalizer implements ProviderErrorNormalizer {
  normalize(error: unknown, provider: CourierProviderId): CourierProviderFailure {
    const errorLike = isErrorLike(error) ? error : {};
    const statusCode = errorLike.statusCode;
    const code = errorLike.code ?? this.resolveCode(statusCode);

    return {
      code,
      message: errorLike.message ?? "Courier provider request failed.",
      provider,
      retryable: this.isRetryable(statusCode, code)
    };
  }

  private isRetryable(statusCode: number | undefined, code: string): boolean {
    if (code === "TIMEOUT" || code === "NETWORK_ERROR") {
      return true;
    }

    return statusCode === undefined || statusCode === 408 || statusCode === 429 || statusCode >= 500;
  }

  private resolveCode(statusCode: number | undefined): string {
    if (statusCode === 401 || statusCode === 403) {
      return "PROVIDER_AUTH_FAILED";
    }

    if (statusCode === 408) {
      return "TIMEOUT";
    }

    if (statusCode === 429) {
      return "PROVIDER_RATE_LIMITED";
    }

    if (statusCode && statusCode >= 500) {
      return "PROVIDER_UNAVAILABLE";
    }

    return "PROVIDER_ERROR";
  }
}
