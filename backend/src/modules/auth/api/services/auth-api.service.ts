import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { AUTH_SESSION_REPOSITORY, AUTH_USER_REPOSITORY } from "../../auth.tokens";
import { AuthenticationService } from "../../authentication.service";
import type { AuthSession, AuthUserPrincipal, DeviceDescriptor, TokenPair } from "../../contracts/auth.types";
import { EmailVerificationService } from "../../email-verification/email-verification.service";
import { Argon2idPasswordHasher } from "../../passwords/argon2id-password.hasher";
import { PasswordChangeService } from "../../passwords/password-change.service";
import { PasswordResetService } from "../../password-reset/password-reset.service";
import type { AuthSessionRepository } from "../../repositories/auth-session.repository";
import type { AuthUserRepository } from "../../repositories/auth-user.repository";
import { JwtTokenService } from "../../tokens/jwt-token.service";
import { RefreshTokenRotationService } from "../../tokens/refresh-token-rotation.service";
import type {
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendVerificationRequestDto,
  ResetPasswordRequestDto,
  UpdateProfileRequestDto
} from "../dto/auth-api.dto";

type RegisterResult = {
  verificationToken?: string;
  user: AuthUserPrincipal;
};

type RefreshResult = {
  sessionId: string;
  tokens: TokenPair;
  user: AuthUserPrincipal;
};

@Injectable()
export class AuthApiService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessionRepository: AuthSessionRepository,
    @Inject(AUTH_USER_REPOSITORY) private readonly userRepository: AuthUserRepository,
    private readonly authenticationService: AuthenticationService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordChangeService: PasswordChangeService,
    private readonly passwordHasher: Argon2idPasswordHasher,
    private readonly passwordResetService: PasswordResetService,
    private readonly prisma: PrismaService,
    private readonly refreshTokenRotationService: RefreshTokenRotationService
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(dto.tenantId, email);
    if (existing) {
      throw new ConflictException("A user with this email already exists.");
    }

    const userRecord = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash: await this.passwordHasher.hash(dto.password),
        phone: dto.phone,
        status: UserStatus.PENDING,
        tenantId: dto.tenantId
      }
    });
    const verificationToken = await this.emailVerificationService.createVerificationToken(
      userRecord.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    const user = await this.userRepository.findById(dto.tenantId, userRecord.id);

    if (!user) {
      throw new BadRequestException("Registered user could not be loaded.");
    }

    return {
      verificationToken: this.shouldExposeDevelopmentToken() ? verificationToken : undefined,
      user
    };
  }

  async login(dto: LoginRequestDto, correlationId: string, device: DeviceDescriptor): Promise<RefreshResult> {
    try {
      return await this.authenticationService.login({
        correlationId,
        device,
        email: dto.email,
        password: dto.password,
        tenantId: dto.tenantId
      });
    } catch {
      throw new UnauthorizedException("Invalid email or password.");
    }
  }

  async refresh(sessionId: string, refreshToken: string): Promise<RefreshResult> {
    const session = await this.sessionRepository.findActiveById(sessionId);
    if (!session) {
      throw new UnauthorizedException("Active session was not found.");
    }

    const user = await this.userRepository.findById(session.tenantId, session.userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Session user is no longer active.");
    }

    const tokenPair = await this.jwtTokenService.createTokenPair(user, sessionId);
    const nextRefreshToken = await this.refreshTokenRotationService.rotate(sessionId, refreshToken, tokenPair.refreshTokenExpiresAt);

    return {
      sessionId,
      tokens: {
        ...tokenPair,
        refreshToken: nextRefreshToken
      },
      user
    };
  }

  async logoutCurrentDevice(user: AuthUserPrincipal, sessionId: string | undefined, correlationId: string): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException("Current session is not available.");
    }

    await this.authenticationService.logoutCurrentDevice(sessionId, {
      action: "auth.logout.current_device",
      actorId: user.id,
      correlationId,
      tenantId: user.tenantId
    });
  }

  async logoutAllDevices(user: AuthUserPrincipal, correlationId: string): Promise<void> {
    await this.authenticationService.logoutAllDevices(user.id, {
      action: "auth.logout.all_devices",
      actorId: user.id,
      correlationId,
      tenantId: user.tenantId
    });
  }

  async verifyEmail(token: string): Promise<{ userId: string }> {
    const userId = await this.emailVerificationService.consumeVerificationToken(token);
    await this.userRepository.markEmailVerified(userId, new Date());
    return { userId };
  }

  async resendVerification(dto: ResendVerificationRequestDto): Promise<{ verificationToken?: string }> {
    const user = await this.userRepository.findByEmail(dto.tenantId, dto.email.toLowerCase());
    if (!user) {
      return {};
    }

    const verificationToken = await this.emailVerificationService.createVerificationToken(
      user.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    return {
      verificationToken: this.shouldExposeDevelopmentToken() ? verificationToken : undefined
    };
  }

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<{ resetToken?: string }> {
    const user = await this.userRepository.findByEmail(dto.tenantId, dto.email.toLowerCase());
    if (!user) {
      return {};
    }

    const resetToken = await this.passwordResetService.createPasswordResetToken(
      user.id,
      new Date(Date.now() + 60 * 60 * 1000)
    );

    return {
      resetToken: this.shouldExposeDevelopmentToken() ? resetToken : undefined
    };
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<{ userId: string }> {
    const userId = await this.passwordResetService.consumePasswordResetToken(dto.token);
    await this.passwordChangeService.changePassword(userId, dto.newPassword);
    await this.sessionRepository.revokeAllForUser(userId, new Date());
    return { userId };
  }

  async changePassword(user: AuthUserPrincipal, dto: ChangePasswordRequestDto): Promise<void> {
    const currentHash = await this.userRepository.getPasswordHash(user.id);
    if (!currentHash || !(await this.passwordHasher.verify(currentHash, dto.currentPassword))) {
      throw new ForbiddenException("Current password is invalid.");
    }

    await this.passwordChangeService.changePassword(user.id, dto.newPassword);
  }

  async getProfile(user: AuthUserPrincipal): Promise<AuthUserPrincipal> {
    const freshUser = await this.userRepository.findById(user.tenantId, user.id);
    if (!freshUser) {
      throw new NotFoundException("User profile was not found.");
    }

    return freshUser;
  }

  async updateProfile(user: AuthUserPrincipal, dto: UpdateProfileRequestDto): Promise<AuthUserPrincipal> {
    await this.prisma.user.update({
      data: {
        locale: dto.locale,
        name: dto.name,
        phone: dto.phone
      },
      where: { id: user.id }
    });

    return this.getProfile(user);
  }

  async getCurrentSession(sessionId: string | undefined): Promise<AuthSession> {
    if (!sessionId) {
      throw new UnauthorizedException("Current session is not available.");
    }

    const session = await this.sessionRepository.findActiveById(sessionId);
    if (!session) {
      throw new NotFoundException("Current session was not found.");
    }

    return session;
  }

  listActiveSessions(user: AuthUserPrincipal): Promise<AuthSession[]> {
    return this.sessionRepository.listActiveForUser(user.id);
  }

  async revokeSession(user: AuthUserPrincipal, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findActiveById(sessionId);
    if (!session || session.userId !== user.id) {
      throw new NotFoundException("Session was not found.");
    }

    await this.sessionRepository.revokeById(sessionId, new Date());
  }

  private shouldExposeDevelopmentToken(): boolean {
    return process.env.NODE_ENV !== "production";
  }
}
