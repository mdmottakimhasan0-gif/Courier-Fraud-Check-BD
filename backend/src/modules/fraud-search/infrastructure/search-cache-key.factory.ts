import { Injectable } from "@nestjs/common";
import { CacheKeyBuilder } from "../../../infrastructure/redis/cache/cache-key.builder";
import type { CourierProviderId } from "../../courier-providers/contracts/courier-provider.types";
import { SearchCacheVersionStrategy } from "./search-cache-version.strategy";

@Injectable()
export class SearchCacheKeyFactory {
  constructor(
    private readonly keyBuilder: CacheKeyBuilder,
    private readonly versionStrategy: SearchCacheVersionStrategy
  ) {}

  duplicateLock(tenantId: string, normalizedPhoneNumber: string): string {
    return this.keyBuilder.tenantScoped(tenantId, ["fraud-search", this.versionStrategy.currentVersion(), "lock", normalizedPhoneNumber]);
  }

  providerResponse(tenantId: string, providerId: CourierProviderId, normalizedPhoneNumber: string): string {
    return this.keyBuilder.tenantScoped(tenantId, [
      "fraud-search",
      this.versionStrategy.currentVersion(),
      "provider",
      providerId,
      normalizedPhoneNumber
    ]);
  }

  searchResult(tenantId: string, normalizedPhoneNumber: string): string {
    return this.keyBuilder.tenantScoped(tenantId, ["fraud-search", this.versionStrategy.currentVersion(), "result", normalizedPhoneNumber]);
  }
}
