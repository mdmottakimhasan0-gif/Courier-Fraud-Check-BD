import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY } from "../auth.tokens";
import type { AuthSessionRepository } from "../repositories/auth-session.repository";
import { SecureTokenService } from "./secure-token.service";

@Injectable()
export class RefreshTokenRotationService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY) private readonly sessionRepository: AuthSessionRepository,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async rotate(sessionId: string, presentedRefreshToken: string, nextExpiresAt: Date): Promise<string> {
    const session = await this.sessionRepository.findActiveById(sessionId);
    if (!session) {
      throw new Error("Active session was not found.");
    }

    const presentedHash = this.secureTokenService.hashToken(presentedRefreshToken);
    if (presentedHash !== session.refreshTokenHash) {
      await this.sessionRepository.revokeById(sessionId, new Date());
      throw new Error("Refresh token reuse detected.");
    }

    const nextRefreshToken = this.secureTokenService.generateOpaqueToken();
    await this.sessionRepository.replaceRefreshToken(
      sessionId,
      this.secureTokenService.hashToken(nextRefreshToken),
      nextExpiresAt
    );

    return nextRefreshToken;
  }
}
