import type { CourierProvider, CourierShipmentStatus, RiskBadge } from "@prisma/client";

export type CourierCredentials = Record<string, string | number | boolean | undefined>;

export type UnifiedCourierOrderInput = {
  amountToCollect: number;
  customerAddress: string;
  customerName: string;
  customerPhone: string;
  deliveryInstruction?: string;
  invoiceNumber: string;
  itemDescription?: string;
  itemQuantity: number;
  itemWeightKg: number;
  merchantOrderId: string;
  provider: CourierProvider;
  providerOptions?: Record<string, unknown>;
};

export type CourierCreateShipmentResult = {
  consignmentId?: string;
  deliveryFee?: number;
  providerOrderId?: string;
  rawResponse: unknown;
  rawStatus?: string;
  status: CourierShipmentStatus;
  trackingId?: string;
};

export type CourierShipmentStatusResult = {
  events: Array<{
    messageBn?: string;
    messageEn?: string;
    occurredAt: Date;
    rawPayload?: unknown;
    rawStatus?: string;
    status: CourierShipmentStatus;
  }>;
  rawResponse: unknown;
  rawStatus?: string;
  status: CourierShipmentStatus;
};

export type MerchantCustomerHistory = {
  cancelledOrders: number;
  deliveredOrders: number;
  lastOrderAt?: Date;
  pendingOrders: number;
  previousOrders: number;
  returnRate: number;
};

export type RiskRecommendation = "recommended" | "caution" | "high_risk";

export type OrderRiskAssessment = {
  badge: RiskBadge;
  explanation: string;
  merchantHistory: MerchantCustomerHistory;
  recommendation: RiskRecommendation;
  score: number;
};
