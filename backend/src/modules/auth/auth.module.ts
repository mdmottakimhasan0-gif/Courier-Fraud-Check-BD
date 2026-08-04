import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { AuthController } from "./api/auth.controller";
import { ApiKeyGuard } from "./api/guards/api-key.guard";
import { JwtAuthGuard } from "./api/guards/jwt-auth.guard";
import { PermissionGuard } from "./api/guards/permission.guard";
import { RefreshTokenGuard } from "./api/guards/refresh-token.guard";
import { RoleGuard } from "./api/guards/role.guard";
import { AuthApiService } from "./api/services/auth-api.service";
import { AccessControlService } from "./access-control/access-control.service";
import { PermissionVersionStrategy } from "./access-control/permission-version.strategy";
import { AuthenticationService } from "./authentication.service";
import { loadAuthConfig } from "./auth-config";
import { AuthConfigService } from "./auth-config.service";
import {
  API_KEY_REPOSITORY,
  AUTH_AUDIT_LOGGER,
  AUTH_CONFIG,
  AUTH_SESSION_REPOSITORY,
  AUTH_USER_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  EMAIL_CHANGE_REPOSITORY,
  MFA_REPOSITORY,
  PASSWORD_HISTORY_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  SUSPICIOUS_LOGIN_REPOSITORY
} from "./auth.tokens";
import { NullAuthAuditLogger } from "./audit/auth-audit.logger";
import { SecureCookieFactory } from "./cookies/secure-cookie.factory";
import { EmailChangeService } from "./email-change/email-change.service";
import { EmailVerificationService } from "./email-verification/email-verification.service";
import { MfaService } from "./mfa/mfa.service";
import { Argon2idPasswordHasher } from "./passwords/argon2id-password.hasher";
import { PasswordChangeService } from "./passwords/password-change.service";
import { PasswordHistoryPolicy } from "./passwords/password-history.policy";
import { PasswordResetService } from "./password-reset/password-reset.service";
import { LoginRateLimiterService } from "./rate-limiting/login-rate-limiter.service";
import { PrismaApiKeyRepository } from "./persistence/prisma/prisma-api-key.repository";
import { PrismaAuthSessionRepository } from "./persistence/prisma/prisma-auth-session.repository";
import { PrismaAuthUserRepository } from "./persistence/prisma/prisma-auth-user.repository";
import { PrismaEmailChangeRepository } from "./persistence/prisma/prisma-email-change.repository";
import { PrismaEmailVerificationTokenRepository } from "./persistence/prisma/prisma-email-verification-token.repository";
import { PrismaMfaRepository } from "./persistence/prisma/prisma-mfa.repository";
import { PrismaPasswordHistoryRepository } from "./persistence/prisma/prisma-password-history.repository";
import { PrismaPasswordResetTokenRepository } from "./persistence/prisma/prisma-password-reset-token.repository";
import { PrismaSuspiciousLoginEventRepository } from "./persistence/prisma/prisma-suspicious-login-event.repository";
import { SessionManagementService } from "./sessions/session-management.service";
import { SuspiciousLoginDetector } from "./suspicious-login/suspicious-login.detector";
import { JwtTokenService } from "./tokens/jwt-token.service";
import { RefreshTokenRotationService } from "./tokens/refresh-token-rotation.service";
import { SecureTokenService } from "./tokens/secure-token.service";

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: loadAuthConfig
    },
    {
      provide: AUTH_USER_REPOSITORY,
      useClass: PrismaAuthUserRepository
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: PrismaAuthSessionRepository
    },
    {
      provide: PASSWORD_HISTORY_REPOSITORY,
      useClass: PrismaPasswordHistoryRepository
    },
    {
      provide: EMAIL_VERIFICATION_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository
    },
    {
      provide: API_KEY_REPOSITORY,
      useClass: PrismaApiKeyRepository
    },
    {
      provide: MFA_REPOSITORY,
      useClass: PrismaMfaRepository
    },
    {
      provide: EMAIL_CHANGE_REPOSITORY,
      useClass: PrismaEmailChangeRepository
    },
    {
      provide: SUSPICIOUS_LOGIN_REPOSITORY,
      useClass: PrismaSuspiciousLoginEventRepository
    },
    {
      provide: AUTH_AUDIT_LOGGER,
      useClass: NullAuthAuditLogger
    },
    AuthConfigService,
    Argon2idPasswordHasher,
    SecureTokenService,
    JwtTokenService,
    RefreshTokenRotationService,
    SessionManagementService,
    LoginRateLimiterService,
    AccessControlService,
    PermissionVersionStrategy,
    PasswordHistoryPolicy,
    PasswordChangeService,
    EmailVerificationService,
    PasswordResetService,
    EmailChangeService,
    MfaService,
    SuspiciousLoginDetector,
    SecureCookieFactory,
    AuthenticationService,
    AuthApiService,
    JwtAuthGuard,
    RefreshTokenGuard,
    RoleGuard,
    PermissionGuard,
    ApiKeyGuard
  ],
  exports: [
    AuthenticationService,
    AccessControlService,
    Argon2idPasswordHasher,
    JwtTokenService,
    RefreshTokenRotationService,
    SessionManagementService,
    LoginRateLimiterService,
    PasswordChangeService,
    EmailVerificationService,
    PasswordResetService,
    EmailChangeService,
    MfaService,
    SuspiciousLoginDetector,
    PermissionVersionStrategy,
    SecureCookieFactory,
    JwtAuthGuard,
    RefreshTokenGuard,
    RoleGuard,
    PermissionGuard,
    ApiKeyGuard
  ]
})
export class AuthModule {}
