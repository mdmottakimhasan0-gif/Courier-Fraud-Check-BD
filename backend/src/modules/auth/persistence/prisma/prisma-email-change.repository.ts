import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { EmailChangeRepository, EmailChangeRequest } from "../../email-change/email-change.types";

@Injectable()
export class PrismaEmailChangeRepository implements EmailChangeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consumeValidToken(tokenHash: string, now: Date): Promise<EmailChangeRequest | null> {
    const request = await this.prisma.emailChangeRequest.findFirst({
      where: {
        completedAt: null,
        expiresAt: { gt: now },
        tokenHash
      }
    });

    if (!request) {
      return null;
    }

    return {
      currentEmail: request.currentEmail,
      expiresAt: request.expiresAt,
      newEmail: request.newEmail,
      tokenHash: request.tokenHash,
      userId: request.userId
    };
  }

  async create(request: EmailChangeRequest): Promise<void> {
    await this.prisma.emailChangeRequest.create({
      data: request
    });
  }

  async markCompleted(userId: string, newEmail: string, completedAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        data: {
          email: newEmail,
          emailVerifiedAt: completedAt,
          permissionVersion: { increment: 1 }
        },
        where: { id: userId }
      }),
      this.prisma.emailChangeRequest.updateMany({
        data: { completedAt },
        where: {
          completedAt: null,
          newEmail,
          userId
        }
      })
    ]);
  }
}
