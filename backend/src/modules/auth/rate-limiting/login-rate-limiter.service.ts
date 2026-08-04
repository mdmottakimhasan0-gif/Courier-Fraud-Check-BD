import { Inject, Injectable } from "@nestjs/common";
import { AUTH_CONFIG } from "../auth.tokens";
import type { AuthConfig } from "../contracts/auth-config.types";

type LoginAttemptBucket = {
  attempts: number;
  lockedUntil?: Date;
  windowStartedAt: number;
};

@Injectable()
export class LoginRateLimiterService {
  private readonly attemptsByKey = new Map<string, LoginAttemptBucket>();

  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  assertCanAttempt(key: string, now = new Date()): void {
    const bucket = this.getBucket(key, now);
    if (bucket.lockedUntil && bucket.lockedUntil > now) {
      throw new Error("Account is temporarily locked due to repeated failed login attempts.");
    }
  }

  recordFailure(key: string, now = new Date()): Date | undefined {
    const bucket = this.getBucket(key, now);
    bucket.attempts += 1;

    if (bucket.attempts >= this.config.security.maxFailedLoginAttempts) {
      bucket.lockedUntil = new Date(now.getTime() + this.config.security.accountLockoutMinutes * 60_000);
    }

    return bucket.lockedUntil;
  }

  recordSuccess(key: string): void {
    this.attemptsByKey.delete(key);
  }

  private getBucket(key: string, now: Date): LoginAttemptBucket {
    const existing = this.attemptsByKey.get(key);
    const windowMs = this.config.security.loginRateLimitWindowSeconds * 1000;

    if (existing && now.getTime() - existing.windowStartedAt <= windowMs) {
      return existing;
    }

    const bucket: LoginAttemptBucket = {
      attempts: 0,
      windowStartedAt: now.getTime()
    };
    this.attemptsByKey.set(key, bucket);
    return bucket;
  }
}
