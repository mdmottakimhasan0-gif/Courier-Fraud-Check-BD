import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { VerificationTokenRecord, VerificationTokenRepository } from "../../repositories/verification-token.repository";

@Injectable()
export class PrismaPasswordResetTokenRepository implements VerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consumeValidToken(tokenHash: string, now: Date): Promise<VerificationTokenRecord | null> {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        consumedAt: null,
        expiresAt: { gt: now },
        tokenHash
      }
    });

    if (!token) {
      return null;
    }

    await this.prisma.passwordResetToken.update({
      data: { consumedAt: now },
      where: { id: token.id }
    });

    return {
      expiresAt: token.expiresAt,
      tokenHash: token.tokenHash,
      userId: token.userId
    };
  }

  async create(record: VerificationTokenRecord): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: record
    });
  }
}
