import { Inject, Injectable } from "@nestjs/common";
import { EMAIL_CHANGE_REPOSITORY } from "../auth.tokens";
import { SecureTokenService } from "../tokens/secure-token.service";
import type { EmailChangeRepository } from "./email-change.types";

@Injectable()
export class EmailChangeService {
  constructor(
    @Inject(EMAIL_CHANGE_REPOSITORY) private readonly emailChangeRepository: EmailChangeRepository,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async requestEmailChange(userId: string, currentEmail: string, newEmail: string, expiresAt: Date): Promise<string> {
    const token = this.secureTokenService.generateOpaqueToken();
    await this.emailChangeRepository.create({
      currentEmail,
      expiresAt,
      newEmail,
      tokenHash: this.secureTokenService.hashToken(token),
      userId
    });

    return token;
  }

  async confirmEmailChange(token: string, now = new Date()): Promise<string> {
    const request = await this.emailChangeRepository.consumeValidToken(
      this.secureTokenService.hashToken(token),
      now
    );

    if (!request) {
      throw new Error("Email change token is invalid or expired.");
    }

    await this.emailChangeRepository.markCompleted(request.userId, request.newEmail, now);
    return request.newEmail;
  }
}
