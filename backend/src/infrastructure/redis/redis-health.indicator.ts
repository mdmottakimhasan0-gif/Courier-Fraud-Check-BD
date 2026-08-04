import { Injectable } from "@nestjs/common";
import { RedisConnectionManager } from "./redis-connection.manager";
import type { RedisHealthSnapshot } from "./redis.types";

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly redis: RedisConnectionManager) {}

  async check(): Promise<RedisHealthSnapshot> {
    const startedAt = Date.now();

    try {
      await this.redis.getClient().ping();
      return {
        latencyMs: Date.now() - startedAt,
        status: "ok"
      };
    } catch {
      return {
        status: "degraded"
      };
    }
  }
}
