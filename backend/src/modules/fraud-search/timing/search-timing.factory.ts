import { Injectable } from "@nestjs/common";
import type { ProviderSearchOutcome, SearchTimingMetrics } from "../contracts/fraud-search.types";

@Injectable()
export class SearchTimingFactory {
  create(startedAt: Date, finishedAt: Date, outcomes: ProviderSearchOutcome[]): SearchTimingMetrics {
    return {
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      finishedAt: finishedAt.toISOString(),
      providerLatency: outcomes.map((outcome) => ({
        durationMs: outcome.latencyMs,
        provider: outcome.provider
      })),
      startedAt: startedAt.toISOString()
    };
  }
}
