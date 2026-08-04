import { Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, PaymentStatus, Prisma, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { AdminAuditService } from "../../../business-management/api/services/admin-audit.service";
import type { AuthUserPrincipal } from "../../../auth/contracts/auth.types";
import { InvoiceNumberGenerator } from "../../invoices/invoice-number.generator";
import { PaymentProviderFactory } from "../../providers/payment-provider.factory";
import { UsageCounterService } from "../../usage/usage-counter.service";
import {
  BillingFilterQueryDto,
  CouponDto,
  PaymentDto,
  PlanDto,
  PromoDto,
  SubscribeDto,
  TenantBillingQueryDto,
  ValidateCouponDto,
  WebhookDto
} from "../dto/billing.dto";

@Injectable()
export class BillingService {
  constructor(
    private readonly audit: AdminAuditService,
    private readonly invoiceNumbers: InvoiceNumberGenerator,
    private readonly paymentProviders: PaymentProviderFactory,
    private readonly prisma: PrismaService,
    private readonly usageCounter: UsageCounterService
  ) {}

  async seedDefaultPlans(tenantId: string) {
    const plans = [
      { name: "Free", slug: "free", priceAmount: 0, dailySearchLimit: 10, monthlySearchLimit: 100, apiRequestLimit: 0, maxApiKeys: 1, maxTeamMembers: 1, maxMerchantAccounts: 1, maxSavedSearches: 100, searchHistoryRetentionDays: 30 },
      { name: "Starter", slug: "starter", priceAmount: 999, dailySearchLimit: 100, monthlySearchLimit: 2000, apiRequestLimit: 5000, maxApiKeys: 3, maxTeamMembers: 5, maxMerchantAccounts: 3, maxSavedSearches: 1000, searchHistoryRetentionDays: 90 },
      { name: "Professional", slug: "professional", priceAmount: 2999, dailySearchLimit: 500, monthlySearchLimit: 15000, apiRequestLimit: 50000, maxApiKeys: 10, maxTeamMembers: 20, maxMerchantAccounts: 10, maxSavedSearches: 10000, searchHistoryRetentionDays: 365, priorityQueue: true, premiumSupport: true },
      { name: "Enterprise", slug: "enterprise", priceAmount: 9999, dailySearchLimit: 5000, monthlySearchLimit: 150000, apiRequestLimit: 500000, maxApiKeys: 50, maxTeamMembers: 200, maxMerchantAccounts: 100, maxSavedSearches: 100000, searchHistoryRetentionDays: 1095, priorityQueue: true, premiumSupport: true, featureFlagAccess: true }
    ];

    await Promise.all(
      plans.map((plan) =>
        this.prisma.plan.upsert({
          create: { ...plan, billingCycle: "MONTHLY", currency: "BDT", historyLimit: plan.maxSavedSearches, tenantId },
          update: { ...plan, historyLimit: plan.maxSavedSearches },
          where: { tenantId_slug: { slug: plan.slug, tenantId } }
        })
      )
    );
    return this.listPlans({ tenantId });
  }

  listPlans(query: TenantBillingQueryDto) {
    return this.prisma.plan.findMany({ orderBy: { priorityRank: "asc" }, where: { deletedAt: null, tenantId: query.tenantId } });
  }

  createPlan(actor: AuthUserPrincipal, dto: PlanDto, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.plan.created", "plan", () =>
      this.prisma.plan.create({ data: { ...dto, historyLimit: dto.maxSavedSearches } })
    );
  }

  updatePlan(actor: AuthUserPrincipal, id: string, dto: PlanDto, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.plan.updated", "plan", () =>
      this.prisma.plan.update({ data: { ...dto, historyLimit: dto.maxSavedSearches }, where: { id } })
    );
  }

  deletePlan(actor: AuthUserPrincipal, id: string, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.plan.deleted", "plan", () =>
      this.prisma.plan.update({ data: { deletedAt: new Date(), isActive: false }, where: { id } })
    );
  }

  async subscribe(actor: AuthUserPrincipal, dto: SubscribeDto, correlationId: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id: dto.planId, tenantId: dto.tenantId } });
    if (!plan) {
      throw new NotFoundException("Plan was not found.");
    }
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const subscription = await this.prisma.subscription.upsert({
      create: { currentPeriodEnd: end, currentPeriodStart: start, idempotencyKey: dto.idempotencyKey, planId: dto.planId, status: SubscriptionStatus.ACTIVE, tenantId: dto.tenantId, userId: dto.userId ?? actor.id },
      update: { currentPeriodEnd: end, currentPeriodStart: start, planId: dto.planId, status: SubscriptionStatus.ACTIVE },
      where: { tenantId_idempotencyKey: { idempotencyKey: dto.idempotencyKey ?? `subscribe:${dto.userId ?? actor.id}:${dto.planId}`, tenantId: dto.tenantId } }
    });
    await this.audit.record({ action: "billing.subscription.subscribed", actor, correlationId, resourceId: subscription.id, resourceType: "subscription" });
    return subscription;
  }

  changeSubscription(actor: AuthUserPrincipal, id: string, status: SubscriptionStatus, correlationId: string, planId?: string) {
    return this.withAudit(actor, correlationId, `billing.subscription.${status.toLowerCase()}`, "subscription", () =>
      this.prisma.subscription.update({ data: { cancelledAt: status === SubscriptionStatus.CANCELLED ? new Date() : null, planId, status }, where: { id } })
    );
  }

  renewSubscription(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return this.withAudit(actor, correlationId, "billing.subscription.renewed", "subscription", () =>
      this.prisma.subscription.update({ data: { currentPeriodEnd: end, currentPeriodStart: start, status: SubscriptionStatus.ACTIVE }, where: { id } })
    );
  }

  async activeSubscription(tenantId: string, userId: string) {
    return this.prisma.subscription.findFirst({ include: { plan: true }, orderBy: { currentPeriodEnd: "desc" }, where: { deletedAt: null, tenantId, userId } });
  }

  usage(tenantId: string, userId?: string) {
    return this.usageCounter.snapshot(tenantId, userId);
  }

  async createPayment(actor: AuthUserPrincipal, dto: PaymentDto, correlationId: string) {
    const existing = await this.prisma.payment.findUnique({ where: { tenantId_idempotencyKey: { idempotencyKey: dto.idempotencyKey, tenantId: dto.tenantId } } });
    if (existing) {
      return existing;
    }
    const payment = await this.prisma.payment.create({ data: { amount: dto.amount, currency: dto.currency ?? "BDT", idempotencyKey: dto.idempotencyKey, provider: dto.provider, status: PaymentStatus.PENDING, subscriptionId: dto.subscriptionId, tenantId: dto.tenantId } });
    const provider = this.paymentProviders.get(dto.provider);
    const response = await provider.createPayment({ amount: dto.amount, correlationId, currency: dto.currency ?? "BDT", idempotencyKey: dto.idempotencyKey, paymentId: payment.id });
    const updated = await this.prisma.payment.update({ data: { providerTransactionId: response.providerReference, status: response.status }, where: { id: payment.id } });
    await this.audit.record({ action: "billing.payment.created", actor, correlationId, resourceId: payment.id, resourceType: "payment" });
    return updated;
  }

  async verifyPayment(id: string, correlationId: string) {
    const payment = await this.paymentOrThrow(id);
    const response = await this.paymentProviders.get(payment.provider).verify(payment.id, correlationId);
    return this.prisma.payment.update({ data: { providerTransactionId: response.providerReference, status: response.status }, where: { id } });
  }

  paymentStatus(id: string) {
    return this.paymentOrThrow(id);
  }

  async cancelPayment(id: string, correlationId: string) {
    const payment = await this.paymentOrThrow(id);
    const response = await this.paymentProviders.get(payment.provider).cancel(payment.id, correlationId);
    return this.prisma.payment.update({ data: { status: response.status }, where: { id } });
  }

  retryPayment(actor: AuthUserPrincipal, id: string, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.payment.retry", "payment", () =>
      this.prisma.payment.update({ data: { status: PaymentStatus.PROCESSING }, where: { id } })
    );
  }

  async handleWebhook(dto: WebhookDto, correlationId: string) {
    const verified = await this.paymentProviders.get(dto.provider).verifyWebhookSignature(JSON.stringify(dto.payload), dto.signature);
    const replayKey = `webhook:${dto.provider}:${dto.eventId}`;
    if (!verified) {
      return { accepted: false, correlationId, reason: "signature_verification_failed" };
    }
    return { accepted: true, correlationId, replayKey };
  }

  async generateInvoice(actor: AuthUserPrincipal, tenantId: string, subscriptionId: string, correlationId: string) {
    const subscription = await this.prisma.subscription.findFirst({ include: { plan: true }, where: { id: subscriptionId, tenantId } });
    if (!subscription) {
      throw new NotFoundException("Subscription was not found.");
    }
    const invoice = await this.prisma.invoice.create({ data: { currency: subscription.plan.currency, invoiceNumber: this.invoiceNumbers.generate(tenantId), sourceKey: `subscription:${subscriptionId}:${Date.now()}`, status: InvoiceStatus.PENDING, subscriptionId, subtotal: subscription.plan.priceAmount, tenantId, total: subscription.plan.priceAmount } });
    await this.audit.record({ action: "billing.invoice.generated", actor, correlationId, resourceId: invoice.id, resourceType: "invoice" });
    return invoice;
  }

  listInvoices(query: BillingFilterQueryDto) {
    return this.prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where: { deletedAt: null, status: query.invoiceStatus, tenantId: query.tenantId } });
  }

  createCoupon(actor: AuthUserPrincipal, dto: CouponDto, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.coupon.created", "coupon", () =>
      this.prisma.coupon.create({ data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined } })
    );
  }

  updateCoupon(actor: AuthUserPrincipal, id: string, dto: CouponDto, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.coupon.updated", "coupon", () =>
      this.prisma.coupon.update({ data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined }, where: { id } })
    );
  }

  disableCoupon(actor: AuthUserPrincipal, id: string, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.coupon.disabled", "coupon", () =>
      this.prisma.coupon.update({ data: { isActive: false }, where: { id } })
    );
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findFirst({ where: { code: dto.code, deletedAt: null, isActive: true, tenantId: dto.tenantId } });
    const now = new Date();
    return { coupon, valid: Boolean(coupon && (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.expiresAt || coupon.expiresAt >= now) && (!coupon.maxRedemptions || coupon.redeemedCount < coupon.maxRedemptions)) };
  }

  createPromo(actor: AuthUserPrincipal, dto: PromoDto, correlationId: string) {
    return this.withAudit(actor, correlationId, "billing.promo.created", "promo_code", () =>
      this.prisma.promoCode.create({ data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined, payload: this.toJson(dto.payload), startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined } })
    );
  }

  listTransactions(query: BillingFilterQueryDto) {
    return this.prisma.payment.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where: { deletedAt: null, status: query.paymentStatus, tenantId: query.tenantId } });
  }

  billingSummary(query: TenantBillingQueryDto) {
    return Promise.all([
      this.prisma.subscription.findFirst({ include: { plan: true }, orderBy: { currentPeriodEnd: "desc" }, where: { deletedAt: null, tenantId: query.tenantId } }),
      this.prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 10, where: { tenantId: query.tenantId } }),
      this.prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 10, where: { tenantId: query.tenantId } })
    ]).then(([activeSubscription, paymentTimeline, invoices]) => ({ activeSubscription, invoices, paymentTimeline }));
  }

  async analytics(query: TenantBillingQueryDto) {
    const [revenue, monthlyRevenue, activeSubscribers, distribution, payments, couponUsage] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.SUCCEEDED, tenantId: query.tenantId } }),
      this.prisma.payment.groupBy({ _sum: { amount: true }, by: ["status"], where: { tenantId: query.tenantId } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE, tenantId: query.tenantId } }),
      this.prisma.subscription.groupBy({ _count: { _all: true }, by: ["status"], where: { tenantId: query.tenantId } }),
      this.prisma.payment.groupBy({ _count: { _all: true }, by: ["provider", "status"], where: { tenantId: query.tenantId } }),
      this.prisma.coupon.findMany({ select: { code: true, redeemedCount: true }, where: { tenantId: query.tenantId } })
    ]);
    return { activeSubscribers, churnSummary: distribution, couponUsage, gatewayStatistics: payments, monthlyRevenue, paymentSuccessRate: payments, revenueSummary: revenue, subscriptionDistribution: distribution };
  }

  private async paymentOrThrow(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException("Payment was not found.");
    }
    return payment;
  }

  private async withAudit<T>(actor: AuthUserPrincipal, correlationId: string, action: string, resourceType: string, operation: () => Promise<T>): Promise<T> {
    const result = await operation();
    const resourceId = typeof result === "object" && result && "id" in result ? String(result.id) : undefined;
    await this.audit.record({ action, actor, correlationId, resourceId, resourceType });
    return result;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
