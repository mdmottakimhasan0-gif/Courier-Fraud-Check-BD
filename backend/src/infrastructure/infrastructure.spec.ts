import { describe, expect, it, vi } from "vitest";
import { QueueRetryPolicy } from "./queues/retry-policy.service";
import { CacheService } from "./redis/cache/cache.service";
import { CacheKeyBuilder } from "./redis/cache/cache-key.builder";
import { CacheMetricsService } from "./redis/cache/cache-metrics.service";

describe("Redis, queue, and health infrastructure validation", () => {
  it("builds normalized tenant-scoped cache keys", () => {
    const builder = new CacheKeyBuilder();

    expect(builder.tenantScoped("Tenant One", ["Fraud Search", "Result", "01712345678"])).toBe(
      "tenant:tenant-one:fraud-search:result:01712345678"
    );
  });

  it("reads and writes cache JSON with hit, miss, write, and delete metrics", async () => {
    const store = new Map<string, string>();
    const redis = {
      getClient: () => ({
        del: vi.fn(async (key: string) => {
          store.delete(key);
        }),
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        set: vi.fn(async (key: string, value: string) => {
          store.set(key, value);
        })
      })
    };
    const metrics = new CacheMetricsService();
    const cache = new CacheService(metrics, redis as never);

    await expect(cache.getJson("missing")).resolves.toBeNull();
    await cache.setJson("risk:1", { score: 42 });
    await expect(cache.getJson("risk:1")).resolves.toEqual({ score: 42 });
    await cache.delete("risk:1");

    expect(metrics.snapshot()).toMatchObject({ deletes: 1, hits: 1, misses: 1, writes: 1 });
  });

  it("uses configured BullMQ retry policy defaults", () => {
    const config = {
      queue: {
        defaultAttempts: 5,
        retryBackoffMs: 10_000
      }
    };
    const policy = new QueueRetryPolicy(config as never);

    expect(policy.defaultJobOptions()).toMatchObject({
      attempts: 5,
      backoff: {
        delay: 10_000,
        type: "exponential"
      },
      removeOnComplete: 1000,
      removeOnFail: false
    });
  });
});
