export interface PasswordHistoryRepository {
  listRecentPasswordHashes(userId: string, limit: number): Promise<string[]>;
  recordPasswordHash(userId: string, passwordHash: string, createdAt: Date): Promise<void>;
}
