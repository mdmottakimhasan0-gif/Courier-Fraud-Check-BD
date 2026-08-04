import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthConfigService } from "../auth-config.service";
import type { AuthUserPrincipal, TokenPair } from "../contracts/auth.types";
import { SecureTokenService } from "./secure-token.service";

type AccessTokenPayload = {
  permissions: string[];
  permissionVersion: number;
  roles: string[];
  sessionId: string;
  sub: string;
  tenantId: string;
};

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly authConfig: AuthConfigService,
    private readonly jwtService: JwtService,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async createTokenPair(user: AuthUserPrincipal, sessionId: string): Promise<TokenPair> {
    const now = Date.now();
    const accessTokenExpiresAt = new Date(now + this.authConfig.tokens.accessTokenTtlSeconds * 1000);
    const refreshTokenExpiresAt = new Date(now + this.authConfig.tokens.refreshTokenTtlSeconds * 1000);
    const accessToken = await this.jwtService.signAsync(this.toAccessPayload(user, sessionId), {
      expiresIn: this.authConfig.tokens.accessTokenTtlSeconds,
      secret: this.authConfig.jwtAccessSecret
    });

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: this.secureTokenService.generateOpaqueToken(),
      refreshTokenExpiresAt
    };
  }

  private toAccessPayload(user: AuthUserPrincipal, sessionId: string): AccessTokenPayload {
    return {
      permissions: user.permissions,
      permissionVersion: user.permissionVersion,
      roles: user.roles,
      sessionId,
      sub: user.id,
      tenantId: user.tenantId
    };
  }
}
