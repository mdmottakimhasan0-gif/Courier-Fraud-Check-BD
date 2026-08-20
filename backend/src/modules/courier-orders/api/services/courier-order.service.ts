import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CourierAccountStatus,
  CourierOrderStatus,
  CourierProvider,
  CourierShipmentStatus,
  CourierStatusSource,
  Prisma,
  RiskBadge
} from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { AuthUserPrincipal } from "../../../auth/contracts/auth.types";
import { AdminAuditService } from "../../../business-management/api/services/admin-audit.service";
import { CredentialEncryptionService } from "../../../business-management/security/credential-encryption.service";
import { FraudSearchEngineService } from "../../../fraud-search/fraud-search-engine.service";
import type { FraudRiskBadge } from "../../../fraud-search/contracts/fraud-search.types";
import type {
  CourierCredentials,
  MerchantCustomerHistory,
  OrderRiskAssessment,
  RiskRecommendation,
  UnifiedCourierOrderInput
} from "../../contracts/courier-order.types";
import { CourierOrderProviderGateway } from "../../providers/courier-order-provider.gateway";
import type { CourierCredentialDto, CreateCourierOrderDto, OrderListQueryDto } from "../dto/courier-order.dto";

const bdPhonePattern = /^(\+?88)?(01[3-9]\d{8})$/;

@Injectable()
export class CourierOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudSearchEngine: FraudSearchEngineService,
    private readonly credentialEncryption: CredentialEncryptionService,
    private readonly auditService: AdminAuditService,
    private readonly providerGateway: CourierOrderProviderGateway
  ) {}

  async saveCredential(user: AuthUserPrincipal, dto: CourierCredentialDto, correlationId: string) {
    const encryptedCredentials = this.credentialEncryption.encrypt(dto.credentials);
    const existing = await this.prisma.courierAccount.findFirst({
      where: {
        deletedAt: null,
        label: dto.label,
        provider: dto.provider,
        tenantId: user.tenantId
      }
    });
    const account = existing
      ? await this.prisma.courierAccount.update({
          data: {
            credentialVersion: { increment: 1 },
            encryptedCredentials,
            status: CourierAccountStatus.UNVERIFIED
          },
          where: { id: existing.id }
        })
      : await this.prisma.courierAccount.create({
          data: {
            encryptedCredentials,
            label: dto.label,
            provider: dto.provider,
            tenantId: user.tenantId
          }
        });

    await this.auditService.record({
      action: "courier.credential.saved",
      actor: user,
      correlationId,
      newValue: { label: account.label, provider: account.provider },
      resourceId: account.id,
      resourceType: "courier_account"
    });

    return this.toCredentialSummary(account);
  }

  async listCredentials(user: AuthUserPrincipal) {
    const accounts = await this.prisma.courierAccount.findMany({
      orderBy: [{ provider: "asc" }, { createdAt: "desc" }],
      where: {
        deletedAt: null,
        tenantId: user.tenantId
      }
    });

    return accounts.map((account) => this.toCredentialSummary(account));
  }

  async assessPhone(user: AuthUserPrincipal, phoneNumber: string, correlationId: string): Promise<OrderRiskAssessment> {
    const normalizedPhone = this.normalizePhone(phoneNumber);
    const [merchantHistory, fraudResult] = await Promise.all([
      this.getMerchantCustomerHistory(user, normalizedPhone),
      this.fraudSearchEngine.search({
        correlationId,
        phoneNumber: normalizedPhone,
        tenantId: user.tenantId
      })
    ]);
    const score = Math.min(100, Math.max(fraudResult.risk.score, this.historyRiskScore(merchantHistory)));
    const badge = this.toPrismaRiskBadge(fraudResult.risk.badge, score);
    const recommendation = this.recommendationFor(score, merchantHistory);

    return {
      badge,
      explanation: this.riskExplanation(recommendation, merchantHistory, score),
      merchantHistory,
      recommendation,
      score
    };
  }

  async createOrder(user: AuthUserPrincipal, dto: CreateCourierOrderDto, correlationId: string) {
    const normalizedPhone = this.normalizePhone(dto.customerPhone);
    const risk = await this.assessPhone(user, normalizedPhone, correlationId);
    const customer = await this.prisma.orderCustomer.upsert({
      create: {
        address: dto.customerAddress,
        metadata: { source: "order_entry" },
        name: dto.customerName,
        normalizedPhone,
        phone: dto.customerPhone,
        secondaryPhone: dto.customerSecondaryPhone,
        tenantId: user.tenantId
      },
      update: {
        address: dto.customerAddress,
        name: dto.customerName,
        phone: dto.customerPhone,
        secondaryPhone: dto.customerSecondaryPhone
      },
      where: {
        tenantId_normalizedPhone: {
          normalizedPhone,
          tenantId: user.tenantId
        }
      }
    });
    const account = await this.resolveCourierAccount(user, dto.provider, dto.courierAccountId);
    const order = await this.prisma.courierOrder.create({
      data: {
        codAmount: dto.codAmount,
        courierAccountId: account.id,
        customerAddress: dto.customerAddress,
        customerName: dto.customerName,
        customerPhone: normalizedPhone,
        deliveryInstruction: dto.deliveryInstruction,
        invoiceNumber: dto.invoiceNumber,
        itemDescription: dto.itemDescription,
        itemQuantity: dto.itemQuantity,
        itemWeight: dto.itemWeightKg,
        merchantOrderId: dto.merchantOrderId,
        orderCustomerId: customer.id,
        providerPayload: this.toProviderPayload(dto),
        riskBadge: risk.badge,
        riskRecommendation: risk.recommendation,
        riskScore: risk.score,
        riskSnapshot: this.toJson(risk),
        selectedProvider: dto.provider,
        status: CourierOrderStatus.SUBMITTING,
        tenantId: user.tenantId,
        userId: user.id
      }
    });

    try {
      const result = await this.providerGateway.createShipment(this.toUnifiedInput(dto), this.decryptCredentials(account.encryptedCredentials));
      const orderStatus = this.toOrderStatus(result.status);
      const updatedOrder = await this.prisma.courierOrder.update({
        data: {
          failureReason: null,
          providerResponse: this.toJson(result.rawResponse),
          status: orderStatus,
          submittedAt: new Date(),
          shipments: {
            create: {
              consignmentId: result.consignmentId,
              courierAccountId: account.id,
              deliveryFee: result.deliveryFee,
              merchantInvoiceId: dto.invoiceNumber,
              provider: dto.provider,
              providerOrderId: result.providerOrderId,
              rawResponse: this.toJson(result.rawResponse),
              rawStatus: result.rawStatus,
              status: result.status,
              tenantId: user.tenantId,
              trackingId: result.trackingId,
              events: {
                create: {
                  correlationId,
                  occurredAt: new Date(),
                  provider: dto.provider,
                  rawPayload: this.toJson(result.rawResponse),
                  rawStatus: result.rawStatus,
                  source: CourierStatusSource.ORDER_CREATE,
                  status: result.status,
                  tenantId: user.tenantId
                }
              }
            }
          }
        },
        include: this.orderInclude(),
        where: { id: order.id }
      });
      await this.auditService.record({
        action: "courier.order.submitted",
        actor: user,
        correlationId,
        newValue: { invoiceNumber: dto.invoiceNumber, provider: dto.provider, status: updatedOrder.status },
        resourceId: updatedOrder.id,
        resourceType: "courier_order"
      });

      return this.toOrderDetails(updatedOrder);
    } catch (error) {
      const failed = await this.prisma.courierOrder.update({
        data: {
          failureReason: error instanceof Error ? error.message : "Courier submission failed.",
          status: CourierOrderStatus.FAILED
        },
        include: this.orderInclude(),
        where: { id: order.id }
      });
      await this.auditService.record({
        action: "courier.order.failed",
        actor: user,
        correlationId,
        newValue: { invoiceNumber: dto.invoiceNumber, provider: dto.provider },
        reason: failed.failureReason ?? undefined,
        resourceId: failed.id,
        resourceType: "courier_order"
      });

      return this.toOrderDetails(failed);
    }
  }

  async listOrders(user: AuthUserPrincipal, query: OrderListQueryDto) {
    const normalizedPhone = query.phoneNumber ? this.normalizePhone(query.phoneNumber) : undefined;
    const where = {
      customerPhone: normalizedPhone,
      deletedAt: null,
      selectedProvider: query.provider,
      tenantId: user.tenantId,
      userId: user.id
    };
    const [items, total] = await Promise.all([
      this.prisma.courierOrder.findMany({
        include: this.orderInclude(),
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        where
      }),
      this.prisma.courierOrder.count({ where })
    ]);

    return {
      items: items.map((order) => this.toOrderDetails(order)),
      total
    };
  }

  async getOrder(user: AuthUserPrincipal, orderId: string) {
    const order = await this.findOwnedOrder(user, orderId);
    return this.toOrderDetails(order);
  }

  async refreshShipment(user: AuthUserPrincipal, shipmentId: string, correlationId: string) {
    const shipment = await this.prisma.courierShipment.findFirst({
      include: {
        courierAccount: true,
        order: true
      },
      where: {
        deletedAt: null,
        id: shipmentId,
        order: {
          tenantId: user.tenantId,
          userId: user.id
        },
        tenantId: user.tenantId
      }
    });
    if (!shipment) {
      throw new NotFoundException("Shipment was not found.");
    }
    const account = shipment.courierAccount ?? (await this.resolveCourierAccount(user, shipment.provider));
    const result = await this.providerGateway.refreshShipmentStatus(shipment.provider, this.decryptCredentials(account.encryptedCredentials), {
      consignmentId: shipment.consignmentId,
      merchantInvoiceId: shipment.merchantInvoiceId,
      trackingId: shipment.trackingId
    });
    const updated = await this.prisma.courierShipment.update({
      data: {
        lastSyncedAt: new Date(),
        rawResponse: this.toJson(result.rawResponse),
        rawStatus: result.rawStatus,
        status: result.status,
        events: {
          create: result.events.map((event) => ({
            correlationId,
            messageBn: event.messageBn,
            messageEn: event.messageEn,
            occurredAt: event.occurredAt,
            provider: shipment.provider,
            rawPayload: this.toJson(event.rawPayload),
            rawStatus: event.rawStatus,
            source: CourierStatusSource.MANUAL_REFRESH,
            status: event.status,
            tenantId: user.tenantId
          }))
        },
        order: {
          update: {
            status: this.toOrderStatus(result.status)
          }
        }
      },
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
          take: 20
        }
      },
      where: { id: shipment.id }
    });

    await this.auditService.record({
      action: "courier.shipment.refreshed",
      actor: user,
      correlationId,
      newValue: { provider: shipment.provider, status: updated.status },
      resourceId: updated.id,
      resourceType: "courier_shipment"
    });

    return this.toShipmentDetails(updated);
  }

  async getCustomerHistory(user: AuthUserPrincipal, phoneNumber: string) {
    return this.getMerchantCustomerHistory(user, this.normalizePhone(phoneNumber));
  }

  async getReports(user: AuthUserPrincipal) {
    const baseWhere = { deletedAt: null, tenantId: user.tenantId, userId: user.id };
    const [total, delivered, cancelled, pending, returned, failed, codDelivered, byProvider] = await Promise.all([
      this.prisma.courierOrder.count({ where: baseWhere }),
      this.prisma.courierOrder.count({ where: { ...baseWhere, status: CourierOrderStatus.DELIVERED } }),
      this.prisma.courierOrder.count({ where: { ...baseWhere, status: CourierOrderStatus.CANCELLED } }),
      this.prisma.courierOrder.count({ where: { ...baseWhere, status: { in: [CourierOrderStatus.PENDING, CourierOrderStatus.PICKUP_PENDING, CourierOrderStatus.IN_TRANSIT, CourierOrderStatus.SUBMITTING] } } }),
      this.prisma.courierOrder.count({ where: { ...baseWhere, status: CourierOrderStatus.RETURNED } }),
      this.prisma.courierOrder.count({ where: { ...baseWhere, status: CourierOrderStatus.FAILED } }),
      this.prisma.courierOrder.aggregate({
        _sum: { codAmount: true },
        where: { ...baseWhere, status: CourierOrderStatus.DELIVERED }
      }),
      this.prisma.courierOrder.groupBy({
        _count: { _all: true },
        by: ["selectedProvider", "status"],
        where: baseWhere
      })
    ]);

    return {
      byProvider: byProvider.map((item) => ({
        count: item._count._all,
        provider: item.selectedProvider,
        status: item.status
      })),
      codDeliveredAmount: Number(codDelivered._sum.codAmount ?? 0),
      summary: {
        cancelled,
        delivered,
        failed,
        pending,
        returnRate: total > 0 ? Math.round(((cancelled + returned) / total) * 10000) / 100 : 0,
        returned,
        total
      }
    };
  }

  private async getMerchantCustomerHistory(user: AuthUserPrincipal, normalizedPhone: string): Promise<MerchantCustomerHistory> {
    const where = {
      customerPhone: normalizedPhone,
      deletedAt: null,
      tenantId: user.tenantId,
      userId: user.id
    };
    const [previousOrders, deliveredOrders, cancelledOrders, pendingOrders, lastOrder] = await Promise.all([
      this.prisma.courierOrder.count({ where }),
      this.prisma.courierOrder.count({ where: { ...where, status: CourierOrderStatus.DELIVERED } }),
      this.prisma.courierOrder.count({ where: { ...where, status: { in: [CourierOrderStatus.CANCELLED, CourierOrderStatus.RETURNED] } } }),
      this.prisma.courierOrder.count({ where: { ...where, status: { in: [CourierOrderStatus.PENDING, CourierOrderStatus.PICKUP_PENDING, CourierOrderStatus.IN_TRANSIT, CourierOrderStatus.SUBMITTING] } } }),
      this.prisma.courierOrder.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
        where
      })
    ]);

    return {
      cancelledOrders,
      deliveredOrders,
      lastOrderAt: lastOrder?.createdAt,
      pendingOrders,
      previousOrders,
      returnRate: previousOrders > 0 ? Math.round((cancelledOrders / previousOrders) * 10000) / 100 : 0
    };
  }

  private async findOwnedOrder(user: AuthUserPrincipal, orderId: string) {
    const order = await this.prisma.courierOrder.findFirst({
      include: this.orderInclude(),
      where: {
        deletedAt: null,
        id: orderId,
        tenantId: user.tenantId,
        userId: user.id
      }
    });
    if (!order) {
      throw new NotFoundException("Order was not found.");
    }

    return order;
  }

  private async resolveCourierAccount(user: AuthUserPrincipal, provider: CourierProvider, accountId?: string) {
    const account = await this.prisma.courierAccount.findFirst({
      where: {
        deletedAt: null,
        id: accountId,
        isActive: true,
        provider,
        tenantId: user.tenantId
      },
      orderBy: { createdAt: "desc" }
    });

    if (!account) {
      throw new BadRequestException(`No active ${provider} courier credential found for this merchant.`);
    }

    return account;
  }

  private decryptCredentials(encryptedCredentials: string): CourierCredentials {
    return this.credentialEncryption.decrypt(encryptedCredentials) as CourierCredentials;
  }

  private normalizePhone(phoneNumber: string): string {
    const compact = phoneNumber.replace(/[\s-]/g, "");
    const match = bdPhonePattern.exec(compact);
    if (!match?.[2]) {
      throw new BadRequestException("Phone number must be a valid Bangladeshi mobile number.");
    }
    return match[2];
  }

  private historyRiskScore(history: MerchantCustomerHistory): number {
    if (history.previousOrders === 0) {
      return 0;
    }
    return Math.min(100, Math.round(history.returnRate));
  }

  private recommendationFor(score: number, history: MerchantCustomerHistory): RiskRecommendation {
    if (score >= 70 || history.returnRate >= 60) {
      return "high_risk";
    }
    if (score >= 40 || history.returnRate >= 30) {
      return "caution";
    }
    return "recommended";
  }

  private riskExplanation(recommendation: RiskRecommendation, history: MerchantCustomerHistory, score: number): string {
    if (recommendation === "high_risk") {
      return `High risk: score ${score}, previous merchant return/cancel rate ${history.returnRate}%.`;
    }
    if (recommendation === "caution") {
      return `Review recommended: score ${score}, previous merchant return/cancel rate ${history.returnRate}%.`;
    }
    return `Recommended: score ${score}, no concerning merchant history detected.`;
  }

  private toPrismaRiskBadge(badge: FraudRiskBadge, score: number): RiskBadge {
    if (score >= 85) {
      return RiskBadge.CRITICAL;
    }
    if (score >= 70) {
      return RiskBadge.HIGH;
    }
    if (score >= 40) {
      return RiskBadge.MEDIUM;
    }
    const map: Record<FraudRiskBadge, RiskBadge> = {
      critical: RiskBadge.CRITICAL,
      high: RiskBadge.HIGH,
      low: RiskBadge.LOW,
      medium: RiskBadge.MEDIUM,
      unknown: RiskBadge.UNKNOWN
    };
    return map[badge];
  }

  private toUnifiedInput(dto: CreateCourierOrderDto): UnifiedCourierOrderInput {
    return {
      amountToCollect: dto.codAmount,
      customerAddress: dto.customerAddress,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      deliveryInstruction: dto.deliveryInstruction,
      invoiceNumber: dto.invoiceNumber,
      itemDescription: dto.itemDescription,
      itemQuantity: dto.itemQuantity,
      itemWeightKg: dto.itemWeightKg,
      merchantOrderId: dto.merchantOrderId,
      provider: dto.provider,
      providerOptions: dto.providerOptions as Record<string, unknown> | undefined
    };
  }

  private toProviderPayload(dto: CreateCourierOrderDto): Prisma.InputJsonValue {
    return {
      provider: dto.provider,
      providerOptions: this.toJson(dto.providerOptions ?? {}),
      requestedFields: {
        codAmount: dto.codAmount,
        customerAddress: dto.customerAddress,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        invoiceNumber: dto.invoiceNumber,
        itemQuantity: dto.itemQuantity,
        itemWeightKg: dto.itemWeightKg,
        merchantOrderId: dto.merchantOrderId
      }
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private toOrderStatus(status: CourierShipmentStatus): CourierOrderStatus {
    const map: Record<CourierShipmentStatus, CourierOrderStatus> = {
      CANCELLED: CourierOrderStatus.CANCELLED,
      DELIVERED: CourierOrderStatus.DELIVERED,
      FAILED: CourierOrderStatus.FAILED,
      HOLD: CourierOrderStatus.HOLD,
      IN_REVIEW: CourierOrderStatus.IN_REVIEW,
      IN_TRANSIT: CourierOrderStatus.IN_TRANSIT,
      PARTIAL_DELIVERED: CourierOrderStatus.PARTIAL_DELIVERED,
      PENDING: CourierOrderStatus.PENDING,
      PICKUP_PENDING: CourierOrderStatus.PICKUP_PENDING,
      RETURNED: CourierOrderStatus.RETURNED,
      UNKNOWN: CourierOrderStatus.UNKNOWN
    };

    return map[status];
  }

  private orderInclude() {
    return {
      customer: true,
      shipments: {
        include: {
          events: {
            orderBy: { occurredAt: "desc" as const },
            take: 20
          }
        },
        orderBy: { createdAt: "desc" as const },
        where: { deletedAt: null }
      }
    };
  }

  private toCredentialSummary(account: {
    createdAt: Date;
    healthStatus: string;
    id: string;
    isActive: boolean;
    label: string;
    provider: CourierProvider;
    status: CourierAccountStatus;
    updatedAt: Date;
  }) {
    return {
      createdAt: account.createdAt,
      healthStatus: account.healthStatus,
      id: account.id,
      isActive: account.isActive,
      label: account.label,
      provider: account.provider,
      status: account.status,
      updatedAt: account.updatedAt
    };
  }

  private toOrderDetails(order: Awaited<ReturnType<CourierOrderService["findOwnedOrder"]>>) {
    return {
      codAmount: Number(order.codAmount),
      createdAt: order.createdAt,
      customer: {
        address: order.customer.address,
        name: order.customer.name,
        normalizedPhone: order.customer.normalizedPhone,
        phone: order.customer.phone
      },
      failureReason: order.failureReason,
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      itemDescription: order.itemDescription,
      itemQuantity: order.itemQuantity,
      itemWeight: Number(order.itemWeight),
      merchantOrderId: order.merchantOrderId,
      provider: order.selectedProvider,
      risk: {
        badge: order.riskBadge,
        recommendation: order.riskRecommendation,
        score: order.riskScore,
        snapshot: order.riskSnapshot
      },
      shipments: order.shipments.map((shipment) => this.toShipmentDetails(shipment)),
      status: order.status,
      submittedAt: order.submittedAt,
      updatedAt: order.updatedAt
    };
  }

  private toShipmentDetails(shipment: {
    consignmentId: string | null;
    createdAt: Date;
    deliveryFee: Prisma.Decimal | null;
    events?: Array<{
      id: string;
      messageBn: string | null;
      messageEn: string | null;
      occurredAt: Date;
      rawStatus: string | null;
      source: CourierStatusSource;
      status: CourierShipmentStatus;
    }>;
    id: string;
    lastSyncedAt: Date | null;
    provider: CourierProvider;
    rawStatus: string | null;
    status: CourierShipmentStatus;
    trackingId: string | null;
    updatedAt: Date;
  }) {
    return {
      consignmentId: shipment.consignmentId,
      createdAt: shipment.createdAt,
      deliveryFee: shipment.deliveryFee ? Number(shipment.deliveryFee) : null,
      events: (shipment.events ?? []).map((event) => ({
        id: event.id,
        messageBn: event.messageBn,
        messageEn: event.messageEn,
        occurredAt: event.occurredAt,
        rawStatus: event.rawStatus,
        source: event.source,
        status: event.status
      })),
      id: shipment.id,
      lastSyncedAt: shipment.lastSyncedAt,
      provider: shipment.provider,
      rawStatus: shipment.rawStatus,
      status: shipment.status,
      trackingId: shipment.trackingId,
      updatedAt: shipment.updatedAt
    };
  }
}
