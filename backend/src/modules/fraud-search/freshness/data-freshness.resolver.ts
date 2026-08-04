import { Injectable } from "@nestjs/common";
import type { SearchDataFreshness, ProviderSearchOutcome } from "../contracts/fraud-search.types";

@Injectable()
export class DataFreshnessResolver {
  forProvider(checkedAt: string | undefined, source: SearchDataFreshness["source"]): SearchDataFreshness {
    const timestamp = checkedAt ?? new Date().toISOString();

    return {
      ageSeconds: this.ageSeconds(timestamp),
      checkedAt: timestamp,
      source
    };
  }

  forSearch(outcomes: ProviderSearchOutcome[], checkedAt: string): SearchDataFreshness {
    const liveOutcomes = outcomes.filter(
      (outcome): outcome is Extract<ProviderSearchOutcome, { status: "fulfilled" }> =>
        outcome.status === "fulfilled" && outcome.dataFreshness.source === "live"
    );

    if (liveOutcomes.length === 0) {
      return this.forProvider(checkedAt, "unavailable");
    }

    const newestTimestamp = liveOutcomes
      .map((outcome) => outcome.dataFreshness.checkedAt)
      .sort()
      .at(-1);

    return this.forProvider(newestTimestamp, "live");
  }

  private ageSeconds(checkedAt: string): number {
    const checkedAtMs = Date.parse(checkedAt);
    if (Number.isNaN(checkedAtMs)) {
      return 0;
    }

    return Math.max(0, Math.round((Date.now() - checkedAtMs) / 1000));
  }
}
