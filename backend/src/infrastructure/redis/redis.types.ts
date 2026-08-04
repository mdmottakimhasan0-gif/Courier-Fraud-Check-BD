export type CacheTtl = {
  seconds: number;
};

export type CacheWriteOptions = {
  ttl?: CacheTtl;
};

export type CacheMetricsSnapshot = {
  hits: number;
  misses: number;
  writes: number;
  deletes: number;
};

export type RedisHealthSnapshot = {
  latencyMs?: number;
  status: "ok" | "degraded";
};
