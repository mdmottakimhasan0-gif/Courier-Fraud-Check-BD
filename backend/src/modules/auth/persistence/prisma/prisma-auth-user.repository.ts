import { Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { AuthUserPrincipal } from "../../contracts/auth.types";
import type { AuthUserRepository } from "../../repositories/auth-user.repository";
import { mapUserPrincipal } from "./auth-prisma.mapper";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(tenantId: string, email: string): Promise<AuthUserPrincipal | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        email,
        tenantId
      },
      include: this.includeAccessGraph()
    });

    return user ? mapUserPrincipal(user) : null;
  }

  async findById(tenantId: string, userId: string): Promise<AuthUserPrincipal | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        id: userId,
        tenantId
      },
      include: this.includeAccessGraph()
    });

    return user ? mapUserPrincipal(user) : null;
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    return user?.passwordHash ?? null;
  }

  async markEmailVerified(userId: string, verifiedAt: Date): Promise<void> {
    await this.prisma.user.update({
      data: {
        emailVerifiedAt: verifiedAt,
        status: UserStatus.ACTIVE
      },
      where: { id: userId }
    });
  }

  async recordFailedLogin(userId: string, _occurredAt: Date): Promise<void> {
    await this.prisma.user.update({
      data: {
        failedLoginCount: { increment: 1 }
      },
      where: { id: userId }
    });
  }

  async recordSuccessfulLogin(userId: string, occurredAt: Date): Promise<void> {
    await this.prisma.user.update({
      data: {
        failedLoginCount: 0,
        lastLoginAt: occurredAt,
        lockedUntil: null
      },
      where: { id: userId }
    });
  }

  async setAccountLockedUntil(userId: string, lockedUntil: Date): Promise<void> {
    await this.prisma.user.update({
      data: {
        lockedUntil,
        status: UserStatus.LOCKED
      },
      where: { id: userId }
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      data: {
        passwordHash,
        permissionVersion: { increment: 1 }
      },
      where: { id: userId }
    });
  }

  private includeAccessGraph() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    } as const;
  }
}
