import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { CorrelationId } from "../../../common/decorators/correlation-id.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RateLimit } from "../../../common/rate-limiting/rate-limit.decorator";
import { apiResponse, type ApiResponsePayload } from "../../../common/responses/api-response.types";
import { JwtAuthGuard } from "../../auth/api/guards/jwt-auth.guard";
import type { AuthUserPrincipal } from "../../auth/contracts/auth.types";
import { SubscriptionEnforcementGuard } from "../../billing/usage/subscription-enforcement.guard";
import { SearchHistoryQueryDto, SearchIdParamDto, SearchPhoneNumberRequestDto } from "./dto/fraud-search-api.dto";
import { FraudSearchApiService } from "./services/fraud-search-api.service";

@ApiTags("Fraud Search")
@ApiBearerAuth()
@ApiBadRequestResponse({ description: "Validation error or invalid phone number." })
@ApiUnauthorizedResponse({ description: "Authentication failed." })
@ApiTooManyRequestsResponse({ description: "Endpoint rate limit exceeded." })
@UseGuards(JwtAuthGuard)
@Controller({
  path: "fraud-search",
  version: "1"
})
export class FraudSearchController {
  constructor(private readonly fraudSearchApiService: FraudSearchApiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionEnforcementGuard)
  @RateLimit({ limit: 30, windowSeconds: 60 })
  @ApiOperation({ summary: "Search courier fraud metrics by Bangladeshi phone number." })
  @ApiOkResponse({ description: "Search completed with provider aggregation." })
  async searchPhoneNumber(
    @CurrentUser() user: AuthUserPrincipal,
    @Body() dto: SearchPhoneNumberRequestDto,
    @CorrelationId() correlationId: string
  ): Promise<ApiResponsePayload> {
    return apiResponse(await this.fraudSearchApiService.searchPhoneNumber(user, dto, correlationId), "Search completed.");
  }

  @Get(":searchId/status")
  @ApiOperation({ summary: "Get search status." })
  @ApiOkResponse({ description: "Search status loaded." })
  @ApiNotFoundResponse({ description: "Search not found." })
  async getSearchStatus(@CurrentUser() user: AuthUserPrincipal, @Param() params: SearchIdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.fraudSearchApiService.getSearchStatus(user, params.searchId), "Search status loaded.");
  }

  @Get(":searchId/result")
  @ApiOperation({ summary: "Get search result summary." })
  @ApiOkResponse({ description: "Search result loaded." })
  @ApiNotFoundResponse({ description: "Search not found." })
  async getSearchResult(@CurrentUser() user: AuthUserPrincipal, @Param() params: SearchIdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.fraudSearchApiService.getSearchResult(user, params.searchId), "Search result loaded.");
  }

  @Get()
  @ApiOperation({ summary: "List authenticated user's search history." })
  @ApiOkResponse({ description: "Search history loaded." })
  async getSearchHistory(
    @CurrentUser() user: AuthUserPrincipal,
    @Query() query: SearchHistoryQueryDto
  ): Promise<ApiResponsePayload> {
    const result = await this.fraudSearchApiService.getSearchHistory(user, query);
    return apiResponse(result.items, "Search history loaded.", {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      total: result.total
    });
  }

  @Get(":searchId")
  @ApiOperation({ summary: "Get search details including provider results." })
  @ApiOkResponse({ description: "Search details loaded." })
  @ApiNotFoundResponse({ description: "Search not found." })
  async getSearchDetails(@CurrentUser() user: AuthUserPrincipal, @Param() params: SearchIdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.fraudSearchApiService.getSearchDetails(user, params.searchId), "Search details loaded.");
  }
}
