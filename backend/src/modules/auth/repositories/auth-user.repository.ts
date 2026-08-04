import type { AuthUserPrincipal } from "../contracts/auth.types";

export interface AuthUserRepository {
  findByEmail(tenantId: string, email: string): Promise<AuthUserPrincipal | null>;
  findById(tenantId: string, userId: string): Promise<AuthUserPrincipal | null>;
  getPasswordHash(userId: string): Promise<string | null>;
  markEmailVerified(userId: string, verifiedAt: Date): Promise<void>;
  recordFailedLogin(userId: string, occurredAt: Date): Promise<void>;
  recordSuccessfulLogin(userId: string, occurredAt: Date): Promise<void>;
  setAccountLockedUntil(userId: string, lockedUntil: Date): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}
