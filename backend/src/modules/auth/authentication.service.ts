import { Inject, Injectable } from "@nestjs/common";
import {
  AUTH_AUDIT_LOGGER,
  AUTH_SESSION_REPOSITORY,
  AUTH_USER_REPOSITORY
} from "./auth.tokens";
import type {
  AuthAuditEvent,
  AuthUserPrincipal,
  DeviceDescriptor,
  TokenPair
} from "./contracts/auth.types";
import type { AuthAuditLogger } from "./audit/auth-audit.logger";
import { Argon2idPasswordHasher } from "./passwords/argon2id-password.hasher";
import { LoginRateLimiterService } from "./rate-limiting/login-rate-limiter.service";
import type { AuthSessionRepository } from "./repositories/auth-session.repository";
import type { AuthUserRepository } from "./repositories/auth-user.repository";
import { SessionManagementService } from "./sessions/session-management.service";
import { JwtTokenService } from "./tokens/jwt-token.service";
import { SecureTokenService } from "./tokens/secure-token.service";

export type LoginCommand = {
  correlationId: string;
  device: DeviceDescriptor;
  email: string;
  password: string;
  tenantId: string;
};

export type LoginResult = {
  sessionId: string;
  tokens: TokenPair;
  user: AuthUserPrincipal;
};

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY) private readonly userRepository: AuthUserRepository,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessionRepository: AuthSessionRepository,
    @Inject(AUTH_AUDIT_LOGGER) private readonly auditLogger: AuthAuditLogger,
    private readonly passwordHasher: Argon2idPasswordHasher,
    private readonly rateLimiter: LoginRateLimiterService,
    private readonly sessionManagement: SessionManagementService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async login(command: LoginCommand): Promise<LoginResult> {
    const rateLimitKey = `${command.tenantId}:${command.email.toLowerCase()}:${command.device.ipAddress ?? "unknown"}`;
    this.rateLimiter.assertCanAttempt(rateLimitKey);

    const user = await this.userRepository.findByEmail(command.tenantId, command.email.toLowerCase());
    const passwordHash = user ? await this.userRepository.getPasswordHash(user.id) : null;

    if (!user || !passwordHash || !(await this.passwordHasher.verify(passwordHash, command.password))) {
      await this.handleFailedLogin(rateLimitKey, command, user);
      throw new Error("Invalid email or password.");
    }

    if (user.status !== "active") {
      await this.recordAudit({
        action: "auth.login.failed",
        actorId: user.id,
        correlationId: command.correlationId,
        device: command.device,
        metadata: { reason: "inactive_user_status", status: user.status },
        tenantId: command.tenantId
      });
      throw new Error("User account is not active.");
    }

    const initialRefreshTokenHash = this.secureTokenService.hashToken(this.secureTokenService.generateOpaqueToken());
    const provisionalExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await this.sessionManagement.createSession(
      user.id,
      user.tenantId,
      initialRefreshTokenHash,
      provisionalExpiry,
      command.device
    );
    const tokens = await this.jwtTokenService.createTokenPair(user, session.id);
    await this.sessionRepository.replaceRefreshToken(
      session.id,
      this.secureTokenService.hashToken(tokens.refreshToken),
      tokens.refreshTokenExpiresAt
    );
    await this.userRepository.recordSuccessfulLogin(user.id, new Date());
    this.rateLimiter.recordSuccess(rateLimitKey);
    await this.recordAudit({
      action: "auth.login.succeeded",
      actorId: user.id,
      correlationId: command.correlationId,
      device: command.device,
      tenantId: user.tenantId
    });

    return {
      sessionId: session.id,
      tokens,
      user
    };
  }

  async logoutCurrentDevice(sessionId: string, event: AuthAuditEvent): Promise<void> {
    await this.sessionManagement.logoutCurrentDevice(sessionId);
    await this.recordAudit({
      ...event,
      action: "auth.logout.current_device"
    });
  }

  async logoutAllDevices(userId: string, event: AuthAuditEvent): Promise<void> {
    await this.sessionManagement.logoutAllDevices(userId);
    await this.recordAudit({
      ...event,
      action: "auth.logout.all_devices"
    });
  }

  private async handleFailedLogin(
    rateLimitKey: string,
    command: LoginCommand,
    user: AuthUserPrincipal | null
  ): Promise<void> {
    const lockedUntil = this.rateLimiter.recordFailure(rateLimitKey);
    if (user) {
      await this.userRepository.recordFailedLogin(user.id, new Date());
      if (lockedUntil) {
        await this.userRepository.setAccountLockedUntil(user.id, lockedUntil);
      }
    }

    await this.recordAudit({
      action: lockedUntil ? "auth.account.locked" : "auth.login.failed",
      actorId: user?.id,
      correlationId: command.correlationId,
      device: command.device,
      metadata: { email: command.email, lockedUntil: lockedUntil?.toISOString() },
      tenantId: command.tenantId
    });
  }

  private recordAudit(event: AuthAuditEvent): Promise<void> {
    return this.auditLogger.record(event);
  }
}
