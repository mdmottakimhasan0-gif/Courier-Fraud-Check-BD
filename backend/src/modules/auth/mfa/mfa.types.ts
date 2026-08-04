export type MfaFactorType = "totp" | "recovery_code";

export type MfaEnrollment = {
  enabledAt?: Date;
  factorType: MfaFactorType;
  secretHash: string;
  userId: string;
};

export type RecoveryCodeSet = {
  codeHashes: string[];
  generatedAt: Date;
  userId: string;
};

export interface MfaRepository {
  findEnabledFactors(userId: string): Promise<MfaEnrollment[]>;
  saveTotpSecret(userId: string, secretHash: string): Promise<void>;
  saveRecoveryCodeHashes(userId: string, codeHashes: string[], generatedAt: Date): Promise<void>;
  markFactorEnabled(userId: string, factorType: MfaFactorType, enabledAt: Date): Promise<void>;
  consumeRecoveryCode(userId: string, codeHash: string, usedAt: Date): Promise<boolean>;
}

export interface TotpVerifier {
  verify(secret: string, code: string, now: Date): Promise<boolean>;
}
