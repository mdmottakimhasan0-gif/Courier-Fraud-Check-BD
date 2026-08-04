import type { PaymentProvider, PaymentStatus } from "@prisma/client";

export type PaymentCreateRequest = {
  amount: number;
  correlationId: string;
  currency: string;
  idempotencyKey: string;
  paymentId: string;
};

export type PaymentProviderResponse = {
  provider: PaymentProvider;
  providerReference: string;
  status: PaymentStatus;
};

export type PaymentWebhookPayload = {
  eventId: string;
  providerReference?: string;
  raw: Readonly<Record<string, unknown>>;
  status: PaymentStatus;
};

export interface PaymentGatewayProvider {
  readonly provider: PaymentProvider;
  cancel(paymentId: string, correlationId: string): Promise<PaymentProviderResponse>;
  createPayment(request: PaymentCreateRequest): Promise<PaymentProviderResponse>;
  verify(paymentId: string, correlationId: string): Promise<PaymentProviderResponse>;
  verifyWebhookSignature(payload: string, signature: string): Promise<boolean>;
}
