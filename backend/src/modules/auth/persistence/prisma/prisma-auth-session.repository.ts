import { Injectable } from "@nestjs/common";
import type { AuthSession } from "../../contracts/auth.types";
import type { AuthSessionRepository, CreateSessionInput } from "../../repositories/auth-session.repository";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { mapAuthSession } from "./auth-prisma.mapper";

@Injectable()
export class PrismaAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<AuthSession> {
    const session = await this.prisma.authSession.create({
      data: {
        device: input.device,
        expiresAt: input.expiresAt,
        refreshTokenHash: input.refreshTokenHash,
        tenantId: input.tenantId,
        userId: input.userId
      }
    });

    return mapAuthSession(session);
  }

  async findActiveById(sessionId: string): Promise<AuthSession | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        id: sessionId,
        revokedAt: null
      }
    });

    return session ? mapAuthSession(session) : null;
  }

  async listActiveForUser(userId: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.authSession.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null,
        userId
      }
    });

    return sessions.map(mapAuthSession);
  }

  async replaceRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.authSession.update({
      data: {
        expiresAt,
        refreshTokenHash
      },
      where: { id: sessionId }
    });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      data: { revokedAt },
      where: {
        revokedAt: null,
        userId
      }
    });
  }

  async revokeById(sessionId: string, revokedAt: Date): Promise<void> {
    await this.prisma.authSession.update({
      data: { revokedAt },
      where: { id: sessionId }
    });
  }
}
