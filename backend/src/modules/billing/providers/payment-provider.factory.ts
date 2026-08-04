import { Injectable } from "@nestjs/common";
import { PaymentProvider } from "@prisma/client";
import type { PaymentGatewayProvider } from "./payment-provider.types";
import { StaticPaymentProvider } from "./static-payment.provider";

@Injectable()
export class PaymentProviderFactory {
  private readonly providers = new Map<PaymentProvider, PaymentGatewayProvider>([
    [PaymentProvider.BKASH, new StaticPaymentProvider(PaymentProvider.BKASH)],
    [PaymentProvider.NAGAD, new StaticPaymentProvider(PaymentProvider.NAGAD)],
    [PaymentProvider.SSLCOMMERZ, new StaticPaymentProvider(PaymentProvider.SSLCOMMERZ)]
  ]);

  get(provider: PaymentProvider): PaymentGatewayProvider {
    const gateway = this.providers.get(provider);
    if (!gateway) {
      return new StaticPaymentProvider(PaymentProvider.MANUAL);
    }

    return gateway;
  }
}
