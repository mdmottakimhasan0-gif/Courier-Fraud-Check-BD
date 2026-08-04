import { Injectable } from "@nestjs/common";
import { LoginRiskLevel, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type {
  CreateSuspiciousLoginEventInput,
  SuspiciousLoginEventRepository,
  SuspiciousLoginRiskLevel
} from "../../repositories/suspicious-login.repository";

@Injectable()
export class PrismaSuspiciousLoginEventRepository implements SuspiciousLoginEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: CreateSuspiciousLoginEventInput): Promise<void> {
    await this.prisma.suspiciousLoginEvent.create({
      data: {
        ipAddress: input.device.ipAddress,
        metadata: this.toJsonObject(input.metadata),
        reasons: input.reasons,
        riskLevel: this.toPrismaRiskLevel(input.riskLevel),
        tenantId: input.tenantId,
        userAgent: input.device.userAgent,
        userId: input.userId
      }
    });
  }

  private toPrismaRiskLevel(riskLevel: SuspiciousLoginRiskLevel): LoginRiskLevel {
    const map: Record<SuspiciousLoginRiskLevel, LoginRiskLevel> = {
      critical: LoginRiskLevel.CRITICAL,
      high: LoginRiskLevel.HIGH,
      low: LoginRiskLevel.LOW,
      medium: LoginRiskLevel.MEDIUM
    };

    return map[riskLevel];
  }

  private toJsonObject(metadata: Readonly<Record<string, unknown>> | undefined): Prisma.InputJsonObject | undefined {
    if (!metadata) {
      return undefined;
    }

    return Object.fromEntries(Object.entries(metadata)) as Prisma.InputJsonObject;
  }
}
