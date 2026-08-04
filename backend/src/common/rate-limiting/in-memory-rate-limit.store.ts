import { Injectable } from "@nestjs/common";

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class InMemoryRateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, limit: number, windowSeconds: number): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowSeconds * 1000
      });
      return { allowed: true };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000)
      };
    }

    existing.count += 1;
    return { allowed: true };
  }
}
