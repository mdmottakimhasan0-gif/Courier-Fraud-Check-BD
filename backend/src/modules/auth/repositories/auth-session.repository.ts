import type { AuthSession, DeviceDescriptor } from "../contracts/auth.types";

export type CreateSessionInput = {
  device: DeviceDescriptor;
  expiresAt: Date;
  refreshTokenHash: string;
  tenantId: string;
  userId: string;
};

export interface AuthSessionRepository {
  create(input: CreateSessionInput): Promise<AuthSession>;
  findActiveById(sessionId: string): Promise<AuthSession | null>;
  listActiveForUser(userId: string): Promise<AuthSession[]>;
  replaceRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void>;
  revokeAllForUser(userId: string, revokedAt: Date): Promise<void>;
  revokeById(sessionId: string, revokedAt: Date): Promise<void>;
}
