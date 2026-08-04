import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_METADATA = "api:rate_limit";

export type RateLimitPolicy = {
  limit: number;
  windowSeconds: number;
};

export function RateLimit(policy: RateLimitPolicy): ReturnType<typeof SetMetadata> {
  return SetMetadata(RATE_LIMIT_METADATA, policy);
}
