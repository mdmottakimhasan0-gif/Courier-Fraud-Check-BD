import { Injectable } from "@nestjs/common";

export type SearchCacheTtlDecision = {
  providerResponseSeconds: number;
  searchResultSeconds: number;
};

@Injectable()
export class SearchCacheTtlPolicy {
  resolve(): SearchCacheTtlDecision {
    return {
      providerResponseSeconds: 900,
      searchResultSeconds: 600
    };
  }
}
