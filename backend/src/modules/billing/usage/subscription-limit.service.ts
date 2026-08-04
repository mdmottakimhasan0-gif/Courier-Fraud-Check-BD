import { ForbiddenException, Injectable } from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { UsageCounterService } from "./usage-counter.service";

@Injectable()
export class SubscriptionLimitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageCounter: UsageCounterService
  ) {}

  async assertFraudSearchAllowed(tenantId: string, userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      where: {
        deletedAt: null,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.TRIALING, SubscriptionStatus.GRACE_PERIOD] },
        tenantId,
        userId
      }
    });

    if (!subscription || subscription.currentPeriodEnd < new Date()) {
      throw new ForbiddenException("An active subscription is required for fraud search.");
    }

    const usage = await this.usageCounter.snapshot(tenantId, userId);
    if (usage.dailySearches >= subscription.plan.dailySearchLimit) {
      throw new ForbiddenException("Daily search limit exceeded.");
    }

    if (usage.monthlySearches >= subscription.plan.monthlySearchLimit) {
      throw new ForbiddenException("Monthly search limit exceeded.");
    }

    if (subscription.plan.apiRequestLimit > 0 && usage.apiCalls >= subscription.plan.apiRequestLimit) {
      throw new ForbiddenException("API request limit exceeded.");
    }
  }
}
