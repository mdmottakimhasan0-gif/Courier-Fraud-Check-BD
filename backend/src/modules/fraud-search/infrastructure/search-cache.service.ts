import { Injectable } from "@nestjs/common";
import { CacheService } from "../../../infrastructure/redis/cache/cache.service";
import type { FraudSearchResult } from "../contracts/fraud-search.types";
import { SearchCacheKeyFactory } from "./search-cache-key.factory";
import { SearchCacheTtlPolicy } from "./search-cache-ttl.policy";

@Injectable()
export class SearchCacheService {
  constructor(
    private readonly cache: CacheService,
    private readonly keys: SearchCacheKeyFactory,
    private readonly ttlPolicy: SearchCacheTtlPolicy
  ) {}

  async get(tenantId: string, normalizedPhoneNumber: string): Promise<FraudSearchResult | null> {
    return this.cache.getJson<FraudSearchResult>(this.keys.searchResult(tenantId, normalizedPhoneNumber));
  }

  async set(tenantId: string, normalizedPhoneNumber: string, result: FraudSearchResult): Promise<void> {
    await this.cache.setJson(this.keys.searchResult(tenantId, normalizedPhoneNumber), result, {
      ttl: {
        seconds: this.ttlPolicy.resolve().searchResultSeconds
      }
    });
  }
}
