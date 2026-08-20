import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import {
  CourierCredentialDto,
  CreateCourierOrderDto,
  OrderIdParamDto,
  OrderListQueryDto,
  PhoneRiskQueryDto,
  ShipmentIdParamDto
} from "./dto/courier-order.dto";
import { CourierOrderService } from "./services/courier-order.service";

@ApiTags("Courier Orders")
@ApiBearerAuth()
@ApiBadRequestResponse({ description: "Validation error or courier provider request issue." })
@ApiUnauthorizedResponse({ description: "Authentication failed." })
@ApiTooManyRequestsResponse({ description: "Endpoint rate limit exceeded." })
@UseGuards(JwtAuthGuard)
@Controller({
  path: "courier-orders",
  version: "1"
})
export class CourierOrderController {
  constructor(private readonly courierOrderService: CourierOrderService) {}

  @Post("credentials")
  @RateLimit({ limit: 20, windowSeconds: 60 })
  @ApiOperation({ summary: "Save encrypted courier provider credentials for the merchant." })
  @ApiOkResponse({ description: "Courier credential saved." })
  async saveCredential(
    @CurrentUser() user: AuthUserPrincipal,
    @Body() dto: CourierCredentialDto,
    @CorrelationId() correlationId: string
  ): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.saveCredential(user, dto, correlationId), "Courier credential saved.");
  }

  @Get("credentials")
  @ApiOperation({ summary: "List merchant courier credentials without exposing secrets." })
  @ApiOkResponse({ description: "Courier credentials loaded." })
  async listCredentials(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.listCredentials(user), "Courier credentials loaded.");
  }

  @Post("risk-check")
  @RateLimit({ limit: 60, windowSeconds: 60 })
  @ApiOperation({ summary: "Check global fraud risk plus merchant-private customer history before creating an order." })
  @ApiOkResponse({ description: "Risk assessment completed." })
  async riskCheck(
    @CurrentUser() user: AuthUserPrincipal,
    @Body() dto: PhoneRiskQueryDto,
    @CorrelationId() correlationId: string
  ): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.assessPhone(user, dto.phoneNumber, correlationId), "Risk assessment completed.");
  }

  @Post()
  @RateLimit({ limit: 30, windowSeconds: 60 })
  @ApiOperation({ summary: "Create a local order and submit it to the selected courier provider." })
  @ApiOkResponse({ description: "Courier order processed." })
  async createOrder(
    @CurrentUser() user: AuthUserPrincipal,
    @Body() dto: CreateCourierOrderDto,
    @CorrelationId() correlationId: string
  ): Promise<ApiResponsePayload> {
    const result = await this.courierOrderService.createOrder(user, dto, correlationId);
    const message = result.status === "FAILED" ? "Order saved but courier submission failed." : "Courier order submitted.";
    return apiResponse(result, message);
  }

  @Get()
  @ApiOperation({ summary: "List current merchant user's courier orders." })
  @ApiOkResponse({ description: "Courier orders loaded." })
  async listOrders(@CurrentUser() user: AuthUserPrincipal, @Query() query: OrderListQueryDto): Promise<ApiResponsePayload> {
    const result = await this.courierOrderService.listOrders(user, query);
    return apiResponse(result.items, "Courier orders loaded.", {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      total: result.total
    });
  }

  @Get("reports/summary")
  @ApiOperation({ summary: "Get current merchant user's courier order report summary." })
  @ApiOkResponse({ description: "Courier reports loaded." })
  async reports(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.getReports(user), "Courier reports loaded.");
  }

  @Get("customers/history")
  @ApiOperation({ summary: "Get merchant-private customer order history by phone number." })
  @ApiOkResponse({ description: "Customer history loaded." })
  async customerHistory(@CurrentUser() user: AuthUserPrincipal, @Query() query: PhoneRiskQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.getCustomerHistory(user, query.phoneNumber), "Customer history loaded.");
  }

  @Get(":orderId")
  @ApiOperation({ summary: "Get courier order details with shipment timeline." })
  @ApiOkResponse({ description: "Courier order loaded." })
  async getOrder(@CurrentUser() user: AuthUserPrincipal, @Param() params: OrderIdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.getOrder(user, params.orderId), "Courier order loaded.");
  }

  @Post("shipments/:shipmentId/refresh")
  @RateLimit({ limit: 30, windowSeconds: 60 })
  @ApiOperation({ summary: "Refresh one shipment status from its courier provider." })
  @ApiOkResponse({ description: "Shipment status refreshed." })
  async refreshShipment(
    @CurrentUser() user: AuthUserPrincipal,
    @Param() params: ShipmentIdParamDto,
    @CorrelationId() correlationId: string
  ): Promise<ApiResponsePayload> {
    return apiResponse(await this.courierOrderService.refreshShipment(user, params.shipmentId, correlationId), "Shipment status refreshed.");
  }
}
