import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { InMemoryRateLimitStore } from "./in-memory-rate-limit.store";
import { RATE_LIMIT_METADATA, type RateLimitPolicy } from "./rate-limit.decorator";

type RateLimitedRequest = Request & {
  apiKey?: {
    id: string;
  };
  user?: {
    id: string;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: InMemoryRateLimitStore
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy | undefined>(RATE_LIMIT_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!policy) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitedRequest>();
    const key = this.resolveKey(request);
    const result = this.store.consume(key, policy.limit, policy.windowSeconds);

    if (!result.allowed) {
      throw new HttpException(
        `Rate limit exceeded. Retry after ${result.retryAfterSeconds ?? policy.windowSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private resolveKey(request: RateLimitedRequest): string {
    if (request.apiKey) {
      return `api-key:${request.apiKey.id}`;
    }

    if (request.user) {
      return `user:${request.user.id}`;
    }

    return `anonymous:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
  }
}
