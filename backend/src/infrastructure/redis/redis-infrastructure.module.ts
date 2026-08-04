import { Global, Module } from "@nestjs/common";
import { CoreConfigModule } from "../../config/core-config.module";
import { CacheInvalidationService } from "./cache/cache-invalidation.service";
import { CacheKeyBuilder } from "./cache/cache-key.builder";
import { CacheMetricsService } from "./cache/cache-metrics.service";
import { CacheService } from "./cache/cache.service";
import { DistributedLockService } from "./locks/distributed-lock.service";
import { RedisConnectionManager } from "./redis-connection.manager";
import { RedisHealthIndicator } from "./redis-health.indicator";

@Global()
@Module({
  imports: [CoreConfigModule],
  providers: [
    RedisConnectionManager,
    CacheKeyBuilder,
    CacheMetricsService,
    CacheService,
    CacheInvalidationService,
    DistributedLockService,
    RedisHealthIndicator
  ],
  exports: [
    RedisConnectionManager,
    CacheKeyBuilder,
    CacheMetricsService,
    CacheService,
    CacheInvalidationService,
    DistributedLockService,
    RedisHealthIndicator
  ]
})
export class RedisInfrastructureModule {}
