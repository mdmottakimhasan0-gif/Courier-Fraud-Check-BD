import { Injectable } from "@nestjs/common";
import type { CacheMetricsSnapshot } from "../redis.types";

@Injectable()
export class CacheMetricsService {
  private deletes = 0;
  private hits = 0;
  private misses = 0;
  private writes = 0;

  recordDelete(): void {
    this.deletes += 1;
  }

  recordHit(): void {
    this.hits += 1;
  }

  recordMiss(): void {
    this.misses += 1;
  }

  recordWrite(): void {
    this.writes += 1;
  }

  snapshot(): CacheMetricsSnapshot {
    return {
      deletes: this.deletes,
      hits: this.hits,
      misses: this.misses,
      writes: this.writes
    };
  }
}
