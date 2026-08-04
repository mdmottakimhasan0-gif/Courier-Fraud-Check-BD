import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

type RefreshTokenRequestBody = {
  refreshToken?: unknown;
  sessionId?: unknown;
};

type RefreshTokenRequest = Request & {
  refreshToken?: string;
  refreshSessionId?: string;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RefreshTokenRequest>();
    const body = request.body as RefreshTokenRequestBody | undefined;
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException("Refresh token and session ID are required.");
    }

    request.refreshToken = refreshToken;
    request.refreshSessionId = sessionId;
    return true;
  }
}
