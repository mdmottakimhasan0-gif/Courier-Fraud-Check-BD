import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY, PASSWORD_HISTORY_REPOSITORY } from "../auth.tokens";
import type { AuthUserRepository } from "../repositories/auth-user.repository";
import type { PasswordHistoryRepository } from "../repositories/password-history.repository";
import { Argon2idPasswordHasher } from "./argon2id-password.hasher";
import { PasswordHistoryPolicy } from "./password-history.policy";

@Injectable()
export class PasswordChangeService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY) private readonly userRepository: AuthUserRepository,
    @Inject(PASSWORD_HISTORY_REPOSITORY) private readonly passwordHistoryRepository: PasswordHistoryRepository,
    private readonly passwordHasher: Argon2idPasswordHasher,
    private readonly passwordHistoryPolicy: PasswordHistoryPolicy
  ) {}

  async changePassword(userId: string, nextPassword: string): Promise<void> {
    await this.passwordHistoryPolicy.assertPasswordWasNotRecentlyUsed(userId, nextPassword);
    const passwordHash = await this.passwordHasher.hash(nextPassword);
    await this.userRepository.updatePasswordHash(userId, passwordHash);
    await this.passwordHistoryRepository.recordPasswordHash(userId, passwordHash, new Date());
  }
}
