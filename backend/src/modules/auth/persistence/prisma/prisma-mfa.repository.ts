import { Injectable } from "@nestjs/common";
import { MfaFactorType } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { MfaEnrollment, MfaRepository, MfaFactorType as AuthMfaFactorType } from "../../mfa/mfa.types";

@Injectable()
export class PrismaMfaRepository implements MfaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEnabledFactors(userId: string): Promise<MfaEnrollment[]> {
    const factors = await this.prisma.mfaFactor.findMany({
      where: {
        enabledAt: { not: null },
        userId
      }
    });

    return factors.map((factor) => ({
      enabledAt: factor.enabledAt ?? undefined,
      factorType: this.toAuthFactorType(factor.factorType),
      secretHash: factor.secretHash,
      userId: factor.userId
    }));
  }

  async saveTotpSecret(userId: string, secretHash: string): Promise<void> {
    await this.prisma.mfaFactor.upsert({
      create: {
        factorType: MfaFactorType.TOTP,
        secretHash,
        userId
      },
      update: { secretHash },
      where: {
        userId_factorType: {
          factorType: MfaFactorType.TOTP,
          userId
        }
      }
    });
  }

  async saveRecoveryCodeHashes(userId: string, codeHashes: string[], generatedAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.recoveryCode.deleteMany({
        where: {
          userId,
          usedAt: null
        }
      }),
      this.prisma.recoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({
          codeHash,
          createdAt: generatedAt,
          userId
        }))
      }),
      this.prisma.mfaFactor.upsert({
        create: {
          factorType: MfaFactorType.RECOVERY_CODE,
          secretHash: "managed-by-recovery-codes",
          userId
        },
        update: {
          secretHash: "managed-by-recovery-codes"
        },
        where: {
          userId_factorType: {
            factorType: MfaFactorType.RECOVERY_CODE,
            userId
          }
        }
      })
    ]);
  }

  async markFactorEnabled(userId: string, factorType: AuthMfaFactorType, enabledAt: Date): Promise<void> {
    await this.prisma.mfaFactor.update({
      data: { enabledAt },
      where: {
        userId_factorType: {
          factorType: this.toPrismaFactorType(factorType),
          userId
        }
      }
    });
  }

  async consumeRecoveryCode(userId: string, codeHash: string, usedAt: Date): Promise<boolean> {
    const result = await this.prisma.recoveryCode.updateMany({
      data: { usedAt },
      where: {
        codeHash,
        usedAt: null,
        userId
      }
    });

    return result.count === 1;
  }

  private toAuthFactorType(factorType: MfaFactorType): AuthMfaFactorType {
    return factorType === MfaFactorType.TOTP ? "totp" : "recovery_code";
  }

  private toPrismaFactorType(factorType: AuthMfaFactorType): MfaFactorType {
    return factorType === "totp" ? MfaFactorType.TOTP : MfaFactorType.RECOVERY_CODE;
  }
}
