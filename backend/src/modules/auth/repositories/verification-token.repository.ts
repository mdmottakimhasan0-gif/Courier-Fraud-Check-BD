export type VerificationTokenRecord = {
  expiresAt: Date;
  tokenHash: string;
  userId: string;
};

export interface VerificationTokenRepository {
  consumeValidToken(tokenHash: string, now: Date): Promise<VerificationTokenRecord | null>;
  create(record: VerificationTokenRecord): Promise<void>;
}
