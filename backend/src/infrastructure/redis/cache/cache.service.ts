import { Injectable } from "@nestjs/common";
import { RedisConnectionManager } from "../redis-connection.manager";
import type { CacheWriteOptions } from "../redis.types";
import { CacheMetricsService } from "./cache-metrics.service";

@Injectable()
export class CacheService {
  constructor(
    private readonly metrics: CacheMetricsService,
    private readonly redis: RedisConnectionManager
  ) {}

  async delete(key: string): Promise<void> {
    await this.redis.getClient().del(key);
    this.metrics.recordDelete();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.getClient().get(key);
    if (!value) {
      this.metrics.recordMiss();
      return null;
    }

    this.metrics.recordHit();
    return JSON.parse(value) as T;
  }

  async setJson<T>(key: string, value: T, options?: CacheWriteOptions): Promise<void> {
    const payload = JSON.stringify(value);
    if (options?.ttl) {
      await this.redis.getClient().set(key, payload, "EX", options.ttl.seconds);
    } else {
      await this.redis.getClient().set(key, payload);
    }
    this.metrics.recordWrite();
  }
}
