import { Inject, Injectable } from "@nestjs/common";
import { AUTH_CONFIG } from "./auth.tokens";
import type { AuthConfig } from "./contracts/auth-config.types";

@Injectable()
export class AuthConfigService {
  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  get cookies(): AuthConfig["cookies"] {
    return this.config.cookies;
  }

  get jwtAccessSecret(): string {
    return this.config.jwtAccessSecret;
  }

  get jwtRefreshSecret(): string {
    return this.config.jwtRefreshSecret;
  }

  get security(): AuthConfig["security"] {
    return this.config.security;
  }

  get tokens(): AuthConfig["tokens"] {
    return this.config.tokens;
  }
}
