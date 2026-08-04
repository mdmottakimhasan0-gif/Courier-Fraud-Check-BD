import { Injectable } from "@nestjs/common";
import type { FraudSearchErrorCode } from "../contracts/fraud-search.types";

@Injectable()
export class SearchErrorCodeNormalizer {
  normalize(reason: unknown): FraudSearchErrorCode {
    const message = reason instanceof Error ? reason.message.toLowerCase() : "";

    if (message.includes("timeout") || message.includes("exceeded")) {
      return "PROVIDER_TIMEOUT";
    }

    if (message.includes("auth") || message.includes("credential") || message.includes("unauthorized")) {
      return "PROVIDER_AUTH_FAILED";
    }

    if (message.includes("rate")) {
      return "PROVIDER_RATE_LIMITED";
    }

    if (message.includes("unavailable") || message.includes("circuit")) {
      return "PROVIDER_UNAVAILABLE";
    }

    return "PROVIDER_UNEXPECTED_ERROR";
  }
}
