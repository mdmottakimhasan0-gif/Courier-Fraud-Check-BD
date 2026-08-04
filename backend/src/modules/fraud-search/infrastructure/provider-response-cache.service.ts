import { Injectable } from "@nestjs/common";
import { CacheService } from "../../../infrastructure/redis/cache/cache.service";
import type { CourierProviderId, CourierProviderResult } from "../../courier-providers/contracts/courier-provider.types";
import { SearchCacheKeyFactory } from "./search-cache-key.factory";
import { SearchCacheTtlPolicy } from "./search-cache-ttl.policy";

@Injectable()
export class ProviderResponseCacheService {
  constructor(
    private readonly cache: CacheService,
    private readonly keys: SearchCacheKeyFactory,
    private readonly ttlPolicy: SearchCacheTtlPolicy
  ) {}

  async get(tenantId: string, providerId: CourierProviderId, normalizedPhoneNumber: string): Promise<CourierProviderResult | null> {
    return this.cache.getJson<CourierProviderResult>(this.keys.providerResponse(tenantId, providerId, normalizedPhoneNumber));
  }

  async set(
    tenantId: string,
    providerId: CourierProviderId,
    normalizedPhoneNumber: string,
    result: CourierProviderResult
  ): Promise<void> {
    await this.cache.setJson(this.keys.providerResponse(tenantId, providerId, normalizedPhoneNumber), result, {
      ttl: {
        seconds: this.ttlPolicy.resolve().providerResponseSeconds
      }
    });
  }
}
