import { Inject, Injectable } from "@nestjs/common";
import { PASSWORD_RESET_REPOSITORY } from "../auth.tokens";
import type { VerificationTokenRepository } from "../repositories/verification-token.repository";
import { SecureTokenService } from "../tokens/secure-token.service";

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly passwordResetRepository: VerificationTokenRepository,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async createPasswordResetToken(userId: string, expiresAt: Date): Promise<string> {
    const token = this.secureTokenService.generateOpaqueToken();
    await this.passwordResetRepository.create({
      expiresAt,
      tokenHash: this.secureTokenService.hashToken(token),
      userId
    });

    return token;
  }

  async consumePasswordResetToken(token: string, now = new Date()): Promise<string> {
    const record = await this.passwordResetRepository.consumeValidToken(
      this.secureTokenService.hashToken(token),
      now
    );

    if (!record) {
      throw new Error("Password reset token is invalid or expired.");
    }

    return record.userId;
  }
}
