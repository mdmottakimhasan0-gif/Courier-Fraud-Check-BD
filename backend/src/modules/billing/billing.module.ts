import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { BusinessManagementModule } from "../business-management/business-management.module";
import { BillingAdminController, BillingController, BillingWebhookController } from "./api/billing.controller";
import { BillingService } from "./api/services/billing.service";
import { InvoiceNumberGenerator } from "./invoices/invoice-number.generator";
import { PaymentProviderFactory } from "./providers/payment-provider.factory";
import { SubscriptionEnforcementGuard } from "./usage/subscription-enforcement.guard";
import { SubscriptionLimitService } from "./usage/subscription-limit.service";
import { UsageCounterService } from "./usage/usage-counter.service";

@Module({
  imports: [AuthModule, BusinessManagementModule, PrismaModule],
  controllers: [BillingController, BillingAdminController, BillingWebhookController],
  providers: [
    BillingService,
    InvoiceNumberGenerator,
    PaymentProviderFactory,
    UsageCounterService,
    SubscriptionLimitService,
    SubscriptionEnforcementGuard
  ],
  exports: [SubscriptionEnforcementGuard, SubscriptionLimitService, UsageCounterService]
})
export class BillingModule {}
