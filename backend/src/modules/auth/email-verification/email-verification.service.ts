import { Inject, Injectable } from "@nestjs/common";
import { EMAIL_VERIFICATION_REPOSITORY } from "../auth.tokens";
import type { VerificationTokenRepository } from "../repositories/verification-token.repository";
import { SecureTokenService } from "../tokens/secure-token.service";

@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(EMAIL_VERIFICATION_REPOSITORY)
    private readonly verificationTokenRepository: VerificationTokenRepository,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async createVerificationToken(userId: string, expiresAt: Date): Promise<string> {
    const token = this.secureTokenService.generateOpaqueToken();
    await this.verificationTokenRepository.create({
      expiresAt,
      tokenHash: this.secureTokenService.hashToken(token),
      userId
    });

    return token;
  }

  async consumeVerificationToken(token: string, now = new Date()): Promise<string> {
    const record = await this.verificationTokenRepository.consumeValidToken(
      this.secureTokenService.hashToken(token),
      now
    );

    if (!record) {
      throw new Error("Email verification token is invalid or expired.");
    }

    return record.userId;
  }
}
