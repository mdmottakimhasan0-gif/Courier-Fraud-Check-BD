import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CourierProvider, RiskBadge, SearchStatus, UserStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  MinLength
} from "class-validator";

export class TenantQueryDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;
}

export class PaginationQueryDto extends TenantQueryDto {
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

export class IdParamDto {
  @ApiProperty({ example: "7a8bf43c-89e5-4952-8e5c-bc5d40e62d16" })
  @IsUUID()
  id!: string;
}

export class AdminLoginDto extends TenantQueryDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  password!: string;
}

export class UserListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: "owner@example.com" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateManagedUserDto extends TenantQueryDto {
  @ApiProperty({ example: "Merchant Operator" })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: "operator@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "+8801712345678" })
  @IsOptional()
  @IsString()
  @Length(8, 32)
  phone?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateManagedUserDto {
  @ApiPropertyOptional({ example: "Merchant Operator" })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: "+8801712345678" })
  @IsOptional()
  @IsString()
  @Length(8, 32)
  phone?: string;

  @ApiPropertyOptional({ example: "bn" })
  @IsOptional()
  @IsString()
  @Length(2, 8)
  locale?: string;
}

export class ChangeUserRoleDto {
  @ApiProperty({ example: "7a8bf43c-89e5-4952-8e5c-bc5d40e62d16" })
  @IsUUID()
  roleId!: string;
}

export class AdminResetUserPasswordDto {
  @ApiProperty({ example: "NewStrongPass123!" })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class CreateRoleDto extends TenantQueryDto {
  @ApiProperty({ example: "Support Agent" })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: "support-agent" })
  @IsString()
  @Length(2, 120)
  slug!: string;

  @ApiPropertyOptional({ example: "Can review searches and help merchants." })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: "Support Agent" })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({ example: "Can review searches and help merchants." })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}

export class PermissionIdsDto {
  @ApiProperty({ example: ["7a8bf43c-89e5-4952-8e5c-bc5d40e62d16"] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  permissionIds!: string[];
}

export class PermissionSearchQueryDto {
  @ApiPropertyOptional({ example: "users" })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ example: "read" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class MerchantCredentialDto extends TenantQueryDto {
  @ApiProperty({ enum: CourierProvider })
  @IsEnum(CourierProvider)
  provider!: CourierProvider;

  @ApiProperty({ example: "Main Steadfast Account" })
  @IsString()
  @Length(2, 120)
  label!: string;

  @ApiProperty({ example: { apiKey: "secret", apiSecret: "secret" } })
  @IsObject()
  credentials!: Record<string, unknown>;
}

export class UpdateMerchantCredentialDto {
  @ApiPropertyOptional({ example: "Main Steadfast Account" })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  label?: string;

  @ApiPropertyOptional({ example: { apiKey: "secret", apiSecret: "secret" } })
  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;
}

export class CreateApiKeyDto extends TenantQueryDto {
  @ApiProperty({ example: "Reporting API Key" })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: ["search:read"] })
  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({ example: "7a8bf43c-89e5-4952-8e5c-bc5d40e62d16" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: "2027-01-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SearchLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: "01712345678" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: CourierProvider })
  @IsOptional()
  @IsEnum(CourierProvider)
  provider?: CourierProvider;

  @ApiPropertyOptional({ enum: SearchStatus })
  @IsOptional()
  @IsEnum(SearchStatus)
  status?: SearchStatus;

  @ApiPropertyOptional({ enum: RiskBadge })
  @IsOptional()
  @IsEnum(RiskBadge)
  riskBadge?: RiskBadge;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class SettingUpdateDto extends TenantQueryDto {
  @ApiProperty({ example: { maintenanceMode: false } })
  @IsObject()
  value!: Record<string, unknown>;
}

export class AnnouncementDto extends TenantQueryDto {
  @ApiProperty({ example: "System maintenance" })
  @IsString()
  @Length(2, 190)
  title!: string;

  @ApiProperty({ example: "We will perform scheduled maintenance tonight." })
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ example: "en" })
  @IsOptional()
  @IsString()
  @Length(2, 8)
  locale?: string;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ example: "System maintenance" })
  @IsOptional()
  @IsString()
  @Length(2, 190)
  title?: string;

  @ApiPropertyOptional({ example: "Updated body." })
  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @ApiPropertyOptional({ example: "en" })
  @IsOptional()
  @IsString()
  @Length(2, 8)
  locale?: string;
}

export class FeatureFlagDto extends TenantQueryDto {
  @ApiProperty({ example: "ai-risk-prediction" })
  @IsString()
  @Length(2, 160)
  key!: string;

  @ApiPropertyOptional({ example: "Enable AI risk scoring." })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: { tenants: [] } })
  @IsOptional()
  @IsObject()
  rules?: Record<string, unknown>;
}
