import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { AuthConfigService } from "../../auth-config.service";
import { AUTH_USER_REPOSITORY } from "../../auth.tokens";
import type { AuthUserPrincipal } from "../../contracts/auth.types";
import type { AuthUserRepository } from "../../repositories/auth-user.repository";
import { Inject } from "@nestjs/common";

type AccessTokenPayload = {
  permissionVersion: number;
  sessionId: string;
  sub: string;
  tenantId: string;
};

type AuthenticatedRequest = Request & {
  sessionId?: string;
  user?: AuthUserPrincipal;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authConfig: AuthConfigService,
    private readonly jwtService: JwtService,
    @Inject(AUTH_USER_REPOSITORY) private readonly userRepository: AuthUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException("Access token is required.");
    }

    const payload = await this.verify(token);
    const user = await this.userRepository.findById(payload.tenantId, payload.sub);
    if (!user || user.status !== "active" || user.permissionVersion !== payload.permissionVersion) {
      throw new UnauthorizedException("Access token is no longer valid.");
    }

    request.user = user;
    request.sessionId = payload.sessionId;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    return authorization.slice("Bearer ".length).trim();
  }

  private async verify(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.authConfig.jwtAccessSecret
      });
    } catch {
      throw new UnauthorizedException("Access token is invalid or expired.");
    }
  }
}
