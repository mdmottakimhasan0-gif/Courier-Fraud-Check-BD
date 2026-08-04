import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";

@Injectable()
export class UsageCounterService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(tenantId: string, userId?: string): Promise<{
    activeSessions: number;
    apiCalls: number;
    apiKeys: number;
    dailySearches: number;
    loginCount: number;
    monthlySearches: number;
    savedSearches: number;
  }> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const userWhere = userId ? { userId } : {};

    const [dailySearches, monthlySearches, savedSearches, apiKeys, activeSessions, loginCount] = await Promise.all([
      this.prisma.searchHistory.count({ where: { createdAt: { gte: dayStart }, tenantId, ...userWhere } }),
      this.prisma.searchHistory.count({ where: { createdAt: { gte: monthStart }, tenantId, ...userWhere } }),
      this.prisma.searchHistory.count({ where: { tenantId, ...userWhere } }),
      this.prisma.apiKey.count({ where: { deletedAt: null, tenantId, userId } }),
      this.prisma.authSession.count({ where: { expiresAt: { gt: now }, revokedAt: null, tenantId, userId: userId ?? undefined } }),
      this.prisma.auditLog.count({ where: { action: "auth.login.succeeded", actorId: userId, tenantId } })
    ]);

    return {
      activeSessions,
      apiCalls: 0,
      apiKeys,
      dailySearches,
      loginCount,
      monthlySearches,
      savedSearches
    };
  }
}
