import { Module } from "@nestjs/common";
import { RedisInfrastructureModule } from "../../infrastructure/redis/redis-infrastructure.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { CourierProvidersModule } from "../courier-providers/courier-providers.module";
import { FraudResultAggregator } from "./aggregation/fraud-result.aggregator";
import { ConfidenceScoreCalculator } from "./confidence/confidence-score.calculator";
import { SearchErrorCodeNormalizer } from "./errors/search-error-code.normalizer";
import { FraudSearchEngineService } from "./fraud-search-engine.service";
import { DataFreshnessResolver } from "./freshness/data-freshness.resolver";
import { FraudSearchController } from "./api/fraud-search.controller";
import { FraudSearchApiService } from "./api/services/fraud-search-api.service";
import { DuplicateSearchPreventionService } from "./infrastructure/duplicate-search-prevention.service";
import { ProviderResponseCacheService } from "./infrastructure/provider-response-cache.service";
import { SearchCacheKeyFactory } from "./infrastructure/search-cache-key.factory";
import { SearchCacheService } from "./infrastructure/search-cache.service";
import { SearchCacheTtlPolicy } from "./infrastructure/search-cache-ttl.policy";
import { SearchCacheVersionStrategy } from "./infrastructure/search-cache-version.strategy";
import { RiskScoreCalculator } from "./risk/risk-score.calculator";
import { SearchTimingFactory } from "./timing/search-timing.factory";
import { BdPhoneNumberValidator } from "./validation/bd-phone-number.validator";
import { StaticProviderWeightStrategy } from "./weights/provider-weight.strategy";

@Module({
  imports: [AuthModule, BillingModule, CourierProvidersModule, RedisInfrastructureModule],
  controllers: [FraudSearchController],
  providers: [
    BdPhoneNumberValidator,
    FraudResultAggregator,
    ConfidenceScoreCalculator,
    RiskScoreCalculator,
    SearchErrorCodeNormalizer,
    DataFreshnessResolver,
    SearchTimingFactory,
    StaticProviderWeightStrategy,
    SearchCacheVersionStrategy,
    SearchCacheTtlPolicy,
    SearchCacheKeyFactory,
    SearchCacheService,
    ProviderResponseCacheService,
    DuplicateSearchPreventionService,
    FraudSearchApiService,
    FraudSearchEngineService
  ],
  exports: [
    FraudSearchEngineService,
    SearchCacheService,
    ProviderResponseCacheService,
    DuplicateSearchPreventionService,
    SearchCacheTtlPolicy,
    SearchCacheVersionStrategy
  ]
})
export class FraudSearchModule {}
