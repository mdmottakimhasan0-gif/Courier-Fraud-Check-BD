export type EmailChangeRequest = {
  currentEmail: string;
  expiresAt: Date;
  newEmail: string;
  tokenHash: string;
  userId: string;
};

export interface EmailChangeRepository {
  consumeValidToken(tokenHash: string, now: Date): Promise<EmailChangeRequest | null>;
  create(request: EmailChangeRequest): Promise<void>;
  markCompleted(userId: string, newEmail: string, completedAt: Date): Promise<void>;
}
