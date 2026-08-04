import { Injectable } from "@nestjs/common";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import type { PaymentCreateRequest, PaymentGatewayProvider, PaymentProviderResponse } from "./payment-provider.types";

@Injectable()
export class StaticPaymentProvider implements PaymentGatewayProvider {
  constructor(readonly provider: PaymentProvider) {}

  createPayment(request: PaymentCreateRequest): Promise<PaymentProviderResponse> {
    return Promise.resolve({
      provider: this.provider,
      providerReference: `${this.provider}-${request.paymentId}`,
      status: PaymentStatus.PROCESSING
    });
  }

  verify(paymentId: string): Promise<PaymentProviderResponse> {
    return Promise.resolve({
      provider: this.provider,
      providerReference: `${this.provider}-${paymentId}`,
      status: PaymentStatus.PROCESSING
    });
  }

  cancel(paymentId: string): Promise<PaymentProviderResponse> {
    return Promise.resolve({
      provider: this.provider,
      providerReference: `${this.provider}-${paymentId}`,
      status: PaymentStatus.CANCELLED
    });
  }

  verifyWebhookSignature(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
