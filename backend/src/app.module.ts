import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ApiResponseInterceptor } from "./common/interceptors/api-response.interceptor";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { InMemoryRateLimitStore } from "./common/rate-limiting/in-memory-rate-limit.store";
import { RateLimitGuard } from "./common/rate-limiting/rate-limit.guard";
import { CoreConfigModule } from "./config/core-config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { BusinessManagementModule } from "./modules/business-management/business-management.module";
import { CourierOrdersModule } from "./modules/courier-orders/courier-orders.module";
import { CourierProvidersModule } from "./modules/courier-providers/courier-providers.module";
import { FraudSearchModule } from "./modules/fraud-search/fraud-search.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [CoreConfigModule, HealthModule, CourierProvidersModule, FraudSearchModule, AuthModule, BusinessManagementModule, BillingModule, CourierOrdersModule],
  controllers: [AppController],
  providers: [
    AppService,
    InMemoryRateLimitStore,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
