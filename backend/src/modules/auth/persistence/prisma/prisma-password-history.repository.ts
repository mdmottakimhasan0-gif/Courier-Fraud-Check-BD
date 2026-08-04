import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { PasswordHistoryRepository } from "../../repositories/password-history.repository";

@Injectable()
export class PrismaPasswordHistoryRepository implements PasswordHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listRecentPasswordHashes(userId: string, limit: number): Promise<string[]> {
    const records = await this.prisma.passwordHistory.findMany({
      orderBy: { createdAt: "desc" },
      select: { passwordHash: true },
      take: limit,
      where: { userId }
    });

    return records.map((record) => record.passwordHash);
  }

  async recordPasswordHash(userId: string, passwordHash: string, createdAt: Date): Promise<void> {
    await this.prisma.passwordHistory.create({
      data: {
        createdAt,
        passwordHash,
        userId
      }
    });
  }
}
