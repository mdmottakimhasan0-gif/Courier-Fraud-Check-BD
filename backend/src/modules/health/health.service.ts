import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../config/app-config.service";
import { QueueHealthService } from "../../infrastructure/queues/queue-health.service";
import type { QueueHealthSnapshot } from "../../infrastructure/queues/queue.types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CacheMetricsService } from "../../infrastructure/redis/cache/cache-metrics.service";
import { RedisHealthIndicator } from "../../infrastructure/redis/redis-health.indicator";
import type { CacheMetricsSnapshot, RedisHealthSnapshot } from "../../infrastructure/redis/redis.types";

export type HealthSnapshot = {
  cache: CacheMetricsSnapshot;
  queues: QueueHealthSnapshot[];
  redis: RedisHealthSnapshot;
  service: string;
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly cacheMetrics: CacheMetricsService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly queueHealth: QueueHealthService,
    private readonly redisHealth: RedisHealthIndicator
  ) {}

  async getHealth(): Promise<HealthSnapshot> {
    const [redis, queues] = await Promise.all([this.redisHealth.check(), this.queueHealth.checkCoreQueues()]);
    const degraded = redis.status === "degraded" || queues.some((queue) => queue.status === "degraded");

    return {
      cache: this.cacheMetrics.snapshot(),
      queues,
      redis,
      service: this.config.appName,
      status: degraded ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    };
  }

  getApplicationHealth(): Omit<HealthSnapshot, "queues" | "redis" | "cache"> {
    return {
      service: this.config.appName,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime())
    };
  }

  async getDatabaseHealth(): Promise<{ latencyMs?: number; status: "ok" | "degraded" }> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
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

  getQueueHealth(): Promise<QueueHealthSnapshot[]> {
    return this.queueHealth.checkCoreQueues();
  }

  getRedisHealth(): Promise<RedisHealthSnapshot> {
    return this.redisHealth.check();
  }
}
