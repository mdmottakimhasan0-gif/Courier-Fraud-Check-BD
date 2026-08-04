import { describe, expect, it, vi } from "vitest";
import type { AuthConfig } from "./contracts/auth-config.types";
import { LoginRateLimiterService } from "./rate-limiting/login-rate-limiter.service";
import { SecureCookieFactory } from "./cookies/secure-cookie.factory";
import { RefreshTokenRotationService } from "./tokens/refresh-token-rotation.service";
import { SecureTokenService } from "./tokens/secure-token.service";

const authConfig: AuthConfig = {
  cookies: {
    domain: ".example.com",
    sameSite: "lax",
    secure: true
  },
  jwtAccessSecret: "access-secret-with-more-than-32-characters",
  jwtRefreshSecret: "refresh-secret-with-more-than-32-characters",
  security: {
    accountLockoutMinutes: 15,
    loginRateLimitWindowSeconds: 300,
    maxFailedLoginAttempts: 3,
    passwordHistoryLimit: 5
  },
  tokens: {
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 2_592_000
  }
};

describe("Authentication security validation", () => {
  it("locks repeated login attempts and clears state after success", () => {
    const limiter = new LoginRateLimiterService(authConfig);
    const now = new Date("2026-08-04T06:00:00.000Z");

    expect(limiter.recordFailure("tenant:email:ip", now)).toBeUndefined();
    expect(limiter.recordFailure("tenant:email:ip", now)).toBeUndefined();
    expect(limiter.recordFailure("tenant:email:ip", now)).toEqual(new Date("2026-08-04T06:15:00.000Z"));
    expect(() => limiter.assertCanAttempt("tenant:email:ip", now)).toThrow("temporarily locked");

    limiter.recordSuccess("tenant:email:ip");
    expect(() => limiter.assertCanAttempt("tenant:email:ip", now)).not.toThrow();
  });

  it("creates secure cookie options for refresh tokens", () => {
    const factory = new SecureCookieFactory({ cookies: authConfig.cookies } as never);

    expect(factory.refreshTokenCookie(3600)).toMatchObject({
      domain: ".example.com",
      httpOnly: true,
      maxAge: 3_600_000,
      path: "/api/v1/auth",
      sameSite: "lax",
      secure: true
    });
  });

  it("rotates refresh tokens and revokes sessions on replay detection", async () => {
    const tokenService = new SecureTokenService();
    const currentToken = "presented-refresh-token";
    const sessionRepository = {
      findActiveById: vi.fn(async () => ({
        refreshTokenHash: tokenService.hashToken(currentToken)
      })),
      replaceRefreshToken: vi.fn(async () => undefined),
      revokeById: vi.fn(async () => undefined)
    };
    const rotation = new RefreshTokenRotationService(sessionRepository as never, tokenService);

    const nextToken = await rotation.rotate("session-1", currentToken, new Date("2026-09-04T06:00:00.000Z"));

    expect(nextToken).not.toBe(currentToken);
    expect(sessionRepository.replaceRefreshToken).toHaveBeenCalledOnce();

    sessionRepository.findActiveById.mockResolvedValueOnce({ refreshTokenHash: "different-hash" });
    await expect(rotation.rotate("session-1", currentToken, new Date())).rejects.toThrow("reuse detected");
    expect(sessionRepository.revokeById).toHaveBeenCalledWith("session-1", expect.any(Date));
  });
});
