import type { DeviceDescriptor } from "../contracts/auth.types";

export type SuspiciousLoginRiskLevel = "low" | "medium" | "high" | "critical";

export type CreateSuspiciousLoginEventInput = {
  device: DeviceDescriptor;
  metadata?: Readonly<Record<string, unknown>>;
  reasons: string[];
  riskLevel: SuspiciousLoginRiskLevel;
  tenantId: string;
  userId?: string;
};

export interface SuspiciousLoginEventRepository {
  record(input: CreateSuspiciousLoginEventInput): Promise<void>;
}
