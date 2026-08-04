import { Injectable } from "@nestjs/common";
import { RedisConnectionManager } from "../redis-connection.manager";
import { CacheMetricsService } from "./cache-metrics.service";

@Injectable()
export class CacheInvalidationService {
  constructor(
    private readonly metrics: CacheMetricsService,
    private readonly redis: RedisConnectionManager
  ) {}

  async deleteMany(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.redis.getClient().del(...keys);
    keys.forEach(() => this.metrics.recordDelete());
  }

  async deleteByPattern(pattern: string): Promise<number> {
    let cursor = "0";
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.redis.getClient().scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.getClient().del(...keys);
        deleted += keys.length;
        keys.forEach(() => this.metrics.recordDelete());
      }
    } while (cursor !== "0");

    return deleted;
  }
}
