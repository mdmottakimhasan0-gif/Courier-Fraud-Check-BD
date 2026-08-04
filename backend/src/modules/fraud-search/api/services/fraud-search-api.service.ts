import { Injectable, NotFoundException } from "@nestjs/common";
import { CourierProvider, RiskBadge, SearchStatus } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { AuthUserPrincipal } from "../../../auth/contracts/auth.types";
import type { CourierProviderId } from "../../../courier-providers/contracts/courier-provider.types";
import type { FraudRiskBadge, FraudSearchResult, FraudSearchStatus, ProviderSearchOutcome } from "../../contracts/fraud-search.types";
import { FraudSearchEngineService } from "../../fraud-search-engine.service";
import type { SearchHistoryQueryDto, SearchPhoneNumberRequestDto } from "../dto/fraud-search-api.dto";

type SearchSummary = {
  completedAt: Date | null;
  createdAt: Date;
  id: string;
  normalizedPhone: string;
  riskBadge: RiskBadge;
  riskScore: number | null;
  startedAt: Date | null;
  status: SearchStatus;
};

@Injectable()
export class FraudSearchApiService {
  constructor(
    private readonly fraudSearchEngine: FraudSearchEngineService,
    private readonly prisma: PrismaService
  ) {}

  async searchPhoneNumber(user: AuthUserPrincipal, dto: SearchPhoneNumberRequestDto, correlationId: string): Promise<{ result: FraudSearchResult; search: SearchSummary }> {
    const result = await this.fraudSearchEngine.search({
      correlationId,
      phoneNumber: dto.phoneNumber,
      tenantId: user.tenantId
    });
    const startedAt = new Date(result.timing.startedAt);
    const completedAt = new Date(result.timing.finishedAt);
    const search = await this.prisma.searchHistory.create({
      data: {
        completedAt,
        normalizedPhone: result.normalizedPhoneNumber,
        riskBadge: this.toPrismaRiskBadge(result.risk.badge),
        riskScore: result.risk.score,
        startedAt,
        status: this.toPrismaSearchStatus(result.status),
        tenantId: user.tenantId,
        userId: user.id,
        fraudResults: {
          create: result.providerOutcomes.map((outcome) => this.toFraudResultCreateInput(user.tenantId, outcome))
        }
      }
    });

    return {
      result,
      search: this.toSearchSummary(search)
    };
  }

  async getSearchStatus(user: AuthUserPrincipal, searchId: string): Promise<SearchSummary> {
    const search = await this.findSearch(user, searchId);
    return this.toSearchSummary(search);
  }

  async getSearchResult(user: AuthUserPrincipal, searchId: string): Promise<unknown> {
    const search = await this.findSearchWithResults(user, searchId);
    return this.toSearchDetails(search);
  }

  async getSearchDetails(user: AuthUserPrincipal, searchId: string): Promise<unknown> {
    const search = await this.findSearchWithResults(user, searchId);
    return this.toSearchDetails(search);
  }

  async getSearchHistory(user: AuthUserPrincipal, query: SearchHistoryQueryDto): Promise<{ items: SearchSummary[]; total: number }> {
    const where = {
      deletedAt: null,
      normalizedPhone: query.phoneNumber,
      tenantId: user.tenantId,
      userId: user.id
    };
    const [items, total] = await Promise.all([
      this.prisma.searchHistory.findMany({
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        where
      }),
      this.prisma.searchHistory.count({ where })
    ]);

    return {
      items: items.map((item) => this.toSearchSummary(item)),
      total
    };
  }

  private async findSearch(user: AuthUserPrincipal, searchId: string) {
    const search = await this.prisma.searchHistory.findFirst({
      where: {
        deletedAt: null,
        id: searchId,
        tenantId: user.tenantId,
        userId: user.id
      }
    });

    if (!search) {
      throw new NotFoundException("Search was not found.");
    }

    return search;
  }

  private async findSearchWithResults(user: AuthUserPrincipal, searchId: string) {
    const search = await this.prisma.searchHistory.findFirst({
      include: {
        fraudResults: {
          orderBy: { createdAt: "asc" },
          where: { deletedAt: null }
        }
      },
      where: {
        deletedAt: null,
        id: searchId,
        tenantId: user.tenantId,
        userId: user.id
      }
    });

    if (!search) {
      throw new NotFoundException("Search was not found.");
    }

    return search;
  }

  private toFraudResultCreateInput(tenantId: string, outcome: ProviderSearchOutcome) {
    if (outcome.status === "rejected") {
      return {
        cancelledOrders: 0,
        provider: this.toPrismaProvider(outcome.provider),
        providerStatus: "failed",
        rawSummary: {
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
          latencyMs: outcome.latencyMs
        },
        responseTimeMs: outcome.latencyMs,
        returnRate: 0,
        successRate: 0,
        successfulOrders: 0,
        tenantId,
        totalOrders: 0
      };
    }

    return {
      cancelledOrders: outcome.result.metrics.cancelledDeliveries,
      provider: this.toPrismaProvider(outcome.provider),
      providerStatus: outcome.result.status,
      rawSummary: outcome.result,
      responseTimeMs: outcome.latencyMs,
      returnRate: outcome.result.metrics.returnRate,
      successRate: outcome.result.metrics.successRate,
      successfulOrders: outcome.result.metrics.successfulDeliveries,
      tenantId,
      totalOrders: outcome.result.metrics.totalOrders
    };
  }

  private toPrismaProvider(provider: CourierProviderId): CourierProvider {
    const map: Record<CourierProviderId, CourierProvider> = {
      pathao: CourierProvider.PATHAO,
      redx: CourierProvider.REDX,
      steadfast: CourierProvider.STEADFAST
    };

    return map[provider];
  }

  private toPrismaRiskBadge(badge: FraudRiskBadge): RiskBadge {
    const map: Record<FraudRiskBadge, RiskBadge> = {
      critical: RiskBadge.CRITICAL,
      high: RiskBadge.HIGH,
      low: RiskBadge.LOW,
      medium: RiskBadge.MEDIUM,
      unknown: RiskBadge.UNKNOWN
    };

    return map[badge];
  }

  private toPrismaSearchStatus(status: FraudSearchStatus): SearchStatus {
    const map: Record<FraudSearchStatus, SearchStatus> = {
      cached: SearchStatus.CACHED,
      completed: SearchStatus.COMPLETED,
      failed: SearchStatus.FAILED,
      partial: SearchStatus.PARTIALLY_COMPLETED,
      queued: SearchStatus.QUEUED,
      searching: SearchStatus.SEARCHING
    };

    return map[status];
  }

  private toSearchDetails(search: Awaited<ReturnType<FraudSearchApiService["findSearchWithResults"]>>): unknown {
    return {
      ...this.toSearchSummary(search),
      providerResults: search.fraudResults.map((result) => ({
        cancelledOrders: result.cancelledOrders,
        createdAt: result.createdAt,
        id: result.id,
        provider: result.provider,
        providerStatus: result.providerStatus,
        rawSummary: result.rawSummary,
        responseTimeMs: result.responseTimeMs,
        returnRate: Number(result.returnRate),
        successRate: Number(result.successRate),
        successfulOrders: result.successfulOrders,
        totalOrders: result.totalOrders
      }))
    };
  }

  private toSearchSummary(search: SearchSummary): SearchSummary {
    return {
      completedAt: search.completedAt,
      createdAt: search.createdAt,
      id: search.id,
      normalizedPhone: search.normalizedPhone,
      riskBadge: search.riskBadge,
      riskScore: search.riskScore,
      startedAt: search.startedAt,
      status: search.status
    };
  }
}
