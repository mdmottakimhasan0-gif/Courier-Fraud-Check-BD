export type AuthTokenConfig = {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

export type AuthSecurityConfig = {
  accountLockoutMinutes: number;
  loginRateLimitWindowSeconds: number;
  maxFailedLoginAttempts: number;
  passwordHistoryLimit: number;
};

export type AuthCookieConfig = {
  domain?: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
};

export type AuthConfig = {
  cookies: AuthCookieConfig;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  security: AuthSecurityConfig;
  tokens: AuthTokenConfig;
};
