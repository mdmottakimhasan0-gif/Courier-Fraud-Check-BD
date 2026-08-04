import type { AuthConfig } from "./contracts/auth-config.types";

function readString(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

function requireStrongSecret(name: string, fallback: string): string {
  const value = readString(name, fallback);
  if (process.env.NODE_ENV === "production" && value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production.`);
  }

  return value;
}

export function loadAuthConfig(): AuthConfig {
  return {
    cookies: {
      domain: process.env.AUTH_COOKIE_DOMAIN,
      sameSite: readString("AUTH_COOKIE_SAME_SITE", "lax") as AuthConfig["cookies"]["sameSite"],
      secure: process.env.NODE_ENV === "production"
    },
    jwtAccessSecret: requireStrongSecret("JWT_ACCESS_SECRET", "development-access-secret-change-me"),
    jwtRefreshSecret: requireStrongSecret("JWT_REFRESH_SECRET", "development-refresh-secret-change-me"),
    security: {
      accountLockoutMinutes: readPositiveInteger("AUTH_ACCOUNT_LOCKOUT_MINUTES", 15),
      loginRateLimitWindowSeconds: readPositiveInteger("AUTH_LOGIN_RATE_WINDOW_SECONDS", 300),
      maxFailedLoginAttempts: readPositiveInteger("AUTH_MAX_FAILED_LOGIN_ATTEMPTS", 5),
      passwordHistoryLimit: readPositiveInteger("AUTH_PASSWORD_HISTORY_LIMIT", 5)
    },
    tokens: {
      accessTokenTtlSeconds: readPositiveInteger("JWT_ACCESS_TOKEN_TTL_SECONDS", 900),
      refreshTokenTtlSeconds: readPositiveInteger("JWT_REFRESH_TOKEN_TTL_SECONDS", 2_592_000)
    }
  };
}
