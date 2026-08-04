import { Inject, Injectable } from "@nestjs/common";
import { AUTH_CONFIG, PASSWORD_HISTORY_REPOSITORY } from "../auth.tokens";
import type { AuthConfig } from "../contracts/auth-config.types";
import type { PasswordHistoryRepository } from "../repositories/password-history.repository";
import { Argon2idPasswordHasher } from "./argon2id-password.hasher";

@Injectable()
export class PasswordHistoryPolicy {
  constructor(
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    @Inject(PASSWORD_HISTORY_REPOSITORY) private readonly passwordHistoryRepository: PasswordHistoryRepository,
    private readonly passwordHasher: Argon2idPasswordHasher
  ) {}

  async assertPasswordWasNotRecentlyUsed(userId: string, candidatePassword: string): Promise<void> {
    const recentHashes = await this.passwordHistoryRepository.listRecentPasswordHashes(
      userId,
      this.config.security.passwordHistoryLimit
    );

    for (const hash of recentHashes) {
      if (await this.passwordHasher.verify(hash, candidatePassword)) {
        throw new Error("Password was used recently and cannot be reused.");
      }
    }
  }
}
