import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BillingCycle, CouponType, InvoiceStatus, PaymentProvider, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class TenantBillingQueryDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;
}

export class BillingPaginationQueryDto extends TenantBillingQueryDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class BillingIdParamDto {
  @ApiProperty({ example: "7a8bf43c-89e5-4952-8e5c-bc5d40e62d16" })
  @IsUUID()
  id!: string;
}

export class PlanDto extends TenantBillingQueryDto {
  @ApiProperty({ example: "Starter" })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: "starter" })
  @IsString()
  @Length(2, 120)
  slug!: string;

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @ApiProperty({ example: 999 })
  @IsNumber()
  @Min(0)
  priceAmount!: number;

  @ApiPropertyOptional({ example: "BDT" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  dailySearchLimit!: number;

  @ApiProperty({ example: 2000 })
  @IsInt()
  monthlySearchLimit!: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  apiRequestLimit!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  maxApiKeys!: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  maxTeamMembers!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  maxMerchantAccounts!: number;

  @ApiProperty({ example: 1000 })
  @IsInt()
  maxSavedSearches!: number;

  @ApiProperty({ example: 90 })
  @IsInt()
  searchHistoryRetentionDays!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priorityQueue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  premiumSupport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featureFlagAccess?: boolean;
}

export class SubscribeDto extends TenantBillingQueryDto {
  @ApiProperty()
  @IsUUID()
  planId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class PaymentDto extends TenantBillingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiProperty({ example: 999 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: "BDT" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsString()
  idempotencyKey!: string;
}

export class WebhookDto {
  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiProperty()
  @IsString()
  eventId!: string;

  @ApiProperty()
  @IsString()
  signature!: string;

  @ApiProperty({ example: { status: "SUCCEEDED" } })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class CouponDto extends TenantBillingQueryDto {
  @ApiProperty()
  @IsString()
  @Length(2, 80)
  code!: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maxRedemptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  perUserRedemptionLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ValidateCouponDto extends TenantBillingQueryDto {
  @ApiProperty()
  @IsString()
  code!: string;
}

export class PromoDto extends TenantBillingQueryDto {
  @ApiProperty()
  @IsString()
  @Length(2, 80)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  couponId?: string;

  @ApiProperty({ example: { campaign: "eid" } })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BillingFilterQueryDto extends BillingPaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  invoiceStatus?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
