import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { BusinessManagementModule } from "../business-management/business-management.module";
import { CourierProvidersModule } from "../courier-providers/courier-providers.module";
import { FraudSearchModule } from "../fraud-search/fraud-search.module";
import { CourierOrderController } from "./api/courier-order.controller";
import { CourierOrderService } from "./api/services/courier-order.service";
import { CourierOrderProviderGateway } from "./providers/courier-order-provider.gateway";
import { CourierStatusNormalizer } from "./status/courier-status.normalizer";

@Module({
  imports: [AuthModule, BusinessManagementModule, CourierProvidersModule, FraudSearchModule, PrismaModule],
  controllers: [CourierOrderController],
  providers: [CourierOrderService, CourierOrderProviderGateway, CourierStatusNormalizer],
  exports: [CourierOrderService]
})
export class CourierOrdersModule {}
