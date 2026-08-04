import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionStatus } from "@prisma/client";
import { CorrelationId } from "../../../common/decorators/correlation-id.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { apiResponse, type ApiResponsePayload } from "../../../common/responses/api-response.types";
import { JwtAuthGuard } from "../../auth/api/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/api/guards/permission.guard";
import { RequirePermissions } from "../../auth/access-control/access-control.decorators";
import type { AuthUserPrincipal } from "../../auth/contracts/auth.types";
import { AdminGuard } from "../../business-management/api/guards/admin.guard";
import {
  BillingFilterQueryDto,
  BillingIdParamDto,
  CouponDto,
  PaymentDto,
  PlanDto,
  PromoDto,
  SubscribeDto,
  TenantBillingQueryDto,
  ValidateCouponDto,
  WebhookDto
} from "./dto/billing.dto";
import { BillingService } from "./services/billing.service";

@ApiTags("Billing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: "billing", version: "1" })
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("plans")
  @ApiOperation({ summary: "List subscription plans." })
  async listPlans(@Query() query: TenantBillingQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.listPlans(query), "Plans loaded.");
  }

  @Post("subscriptions")
  @ApiOperation({ summary: "Subscribe to a plan." })
  async subscribe(@CurrentUser() user: AuthUserPrincipal, @Body() dto: SubscribeDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.subscribe(user, dto, correlationId), "Subscription created.");
  }

  @Post("subscriptions/:id/upgrade")
  @ApiOperation({ summary: "Upgrade subscription." })
  async upgrade(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @Body() dto: SubscribeDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.changeSubscription(user, params.id, SubscriptionStatus.ACTIVE, correlationId, dto.planId), "Subscription upgraded.");
  }

  @Post("subscriptions/:id/downgrade")
  @ApiOperation({ summary: "Downgrade subscription." })
  async downgrade(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @Body() dto: SubscribeDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.changeSubscription(user, params.id, SubscriptionStatus.ACTIVE, correlationId, dto.planId), "Subscription downgraded.");
  }

  @Post("subscriptions/:id/renew")
  @ApiOperation({ summary: "Renew subscription." })
  async renew(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.renewSubscription(user, params.id, correlationId), "Subscription renewed.");
  }

  @Post("subscriptions/:id/cancel")
  @ApiOperation({ summary: "Cancel subscription." })
  async cancel(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.changeSubscription(user, params.id, SubscriptionStatus.CANCELLED, correlationId), "Subscription cancelled.");
  }

  @Post("subscriptions/:id/resume")
  @ApiOperation({ summary: "Resume subscription." })
  async resume(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.changeSubscription(user, params.id, SubscriptionStatus.ACTIVE, correlationId), "Subscription resumed.");
  }

  @Get("subscriptions/active")
  @ApiOperation({ summary: "Get active subscription." })
  async activeSubscription(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.activeSubscription(user.tenantId, user.id), "Active subscription loaded.");
  }

  @Get("usage")
  @ApiOperation({ summary: "Get usage counters." })
  async usage(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.usage(user.tenantId, user.id), "Usage loaded.");
  }

  @Post("payments")
  @ApiOperation({ summary: "Create payment." })
  async createPayment(@CurrentUser() user: AuthUserPrincipal, @Body() dto: PaymentDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.createPayment(user, dto, correlationId), "Payment created.");
  }

  @Post("payments/:id/verify")
  @ApiOperation({ summary: "Verify payment." })
  async verifyPayment(@Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.verifyPayment(params.id, correlationId), "Payment verified.");
  }

  @Post("payments/:id/cancel")
  @ApiOperation({ summary: "Cancel payment." })
  async cancelPayment(@Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.cancelPayment(params.id, correlationId), "Payment cancelled.");
  }

  @Post("payments/:id/retry")
  @ApiOperation({ summary: "Retry payment." })
  async retryPayment(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.retryPayment(user, params.id, correlationId), "Payment retry recorded.");
  }

  @Get("payments/:id/status")
  @ApiOperation({ summary: "Get payment status." })
  async paymentStatus(@Param() params: BillingIdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.paymentStatus(params.id), "Payment status loaded.");
  }

  @Post("invoices/subscriptions/:id")
  @ApiOperation({ summary: "Generate subscription invoice." })
  async generateInvoice(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantBillingQueryDto, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.generateInvoice(user, query.tenantId, params.id, correlationId), "Invoice generated.");
  }

  @Get("invoices")
  @ApiOperation({ summary: "List invoices." })
  async listInvoices(@Query() query: BillingFilterQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.listInvoices(query), "Invoices loaded.");
  }

  @Get("history")
  @ApiOperation({ summary: "Billing history and summary." })
  async billingHistory(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.billingSummary({ tenantId: user.tenantId }), "Billing history loaded.");
  }

  @Post("coupons/validate")
  @ApiOperation({ summary: "Validate coupon." })
  async validateCoupon(@Body() dto: ValidateCouponDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.validateCoupon(dto), "Coupon validation completed.");
  }
}

@ApiTags("Billing Webhooks")
@Controller({ path: "billing/webhooks", version: "1" })
export class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post("payment")
  @ApiOperation({ summary: "Future-ready payment webhook endpoint with signature verification contract." })
  async paymentWebhook(@Body() dto: WebhookDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.handleWebhook(dto, correlationId), "Webhook processed.");
  }
}

@ApiTags("Billing Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
@Controller({ path: "admin/billing", version: "1" })
export class BillingAdminController {
  constructor(private readonly billing: BillingService) {}

  @Post("plans/defaults")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Seed configurable default plans." })
  async seedPlans(@Query() query: TenantBillingQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.seedDefaultPlans(query.tenantId), "Default plans prepared.");
  }

  @Post("plans")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Create plan." })
  async createPlan(@CurrentUser() user: AuthUserPrincipal, @Body() dto: PlanDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.createPlan(user, dto, correlationId), "Plan created.");
  }

  @Patch("plans/:id")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Update plan." })
  async updatePlan(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @Body() dto: PlanDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.updatePlan(user, params.id, dto, correlationId), "Plan updated.");
  }

  @Delete("plans/:id")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Delete plan." })
  async deletePlan(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.deletePlan(user, params.id, correlationId), "Plan deleted.");
  }

  @Post("coupons")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Create coupon." })
  async createCoupon(@CurrentUser() user: AuthUserPrincipal, @Body() dto: CouponDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.createCoupon(user, dto, correlationId), "Coupon created.");
  }

  @Patch("coupons/:id")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Update coupon." })
  async updateCoupon(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @Body() dto: CouponDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.updateCoupon(user, params.id, dto, correlationId), "Coupon updated.");
  }

  @Post("coupons/:id/disable")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Disable coupon." })
  async disableCoupon(@CurrentUser() user: AuthUserPrincipal, @Param() params: BillingIdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.disableCoupon(user, params.id, correlationId), "Coupon disabled.");
  }

  @Post("promos")
  @RequirePermissions("billing:manage")
  @ApiOperation({ summary: "Create promo campaign." })
  async createPromo(@CurrentUser() user: AuthUserPrincipal, @Body() dto: PromoDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.createPromo(user, dto, correlationId), "Promo campaign created.");
  }

  @Get("transactions")
  @RequirePermissions("billing:read")
  @ApiOperation({ summary: "List transactions." })
  async transactions(@Query() query: BillingFilterQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.listTransactions(query), "Transactions loaded.");
  }

  @Get("analytics")
  @RequirePermissions("billing:read")
  @ApiOperation({ summary: "Billing analytics." })
  async analytics(@Query() query: TenantBillingQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.billing.analytics(query), "Billing analytics loaded.");
  }
}
