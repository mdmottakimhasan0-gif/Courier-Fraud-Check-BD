import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CourierProvider } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

export class CourierCredentialDto {
  @ApiProperty({ enum: CourierProvider })
  @IsEnum(CourierProvider)
  provider!: CourierProvider;

  @ApiProperty({ example: "Main Steadfast account" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label!: string;

  @ApiProperty({ description: "Provider credential fields. Values are encrypted before persistence." })
  @IsObject()
  credentials!: Record<string, string | number | boolean>;
}

export class ProviderOptionsDto {
  @ApiPropertyOptional({ description: "Pathao store ID." })
  @IsOptional()
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ description: "Pathao delivery type: 48 normal, 12 on demand." })
  @IsOptional()
  @IsInt()
  deliveryType?: number;

  @ApiPropertyOptional({ description: "Pathao item type: 1 document, 2 parcel." })
  @IsOptional()
  @IsInt()
  itemType?: number;

  @ApiPropertyOptional({ description: "RedX delivery area name." })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryArea?: string;

  @ApiPropertyOptional({ description: "RedX delivery area ID." })
  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryAreaId?: number;

  @ApiPropertyOptional({ description: "RedX pickup store ID." })
  @IsOptional()
  @IsInt()
  @Min(1)
  pickupStoreId?: number;

  @ApiPropertyOptional({ description: "Declared parcel value." })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: "Whether RedX parcel is closed-box." })
  @IsOptional()
  @IsBoolean()
  isClosedBox?: boolean;
}

export class CreateCourierOrderDto {
  @ApiProperty({ enum: CourierProvider })
  @IsEnum(CourierProvider)
  provider!: CourierProvider;

  @ApiPropertyOptional({ description: "Courier account to use. Defaults to first active account for provider." })
  @IsOptional()
  @IsUUID()
  courierAccountId?: string;

  @ApiProperty({ example: "ORD-10001" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  merchantOrderId!: string;

  @ApiProperty({ example: "INV-10001" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  invoiceNumber!: string;

  @ApiProperty({ example: "Rahim Uddin" })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  customerName!: string;

  @ApiProperty({ example: "01711111111" })
  @Matches(/^(\+?88)?01[3-9]\d{8}$/)
  customerPhone!: string;

  @ApiPropertyOptional({ example: "01811111111" })
  @IsOptional()
  @Matches(/^(\+?88)?01[3-9]\d{8}$/)
  customerSecondaryPhone?: string;

  @ApiProperty({ example: "House 10, Road 2, Mirpur, Dhaka" })
  @IsString()
  @MinLength(10)
  @MaxLength(250)
  customerAddress!: string;

  @ApiProperty({ example: 1250 })
  @IsNumber()
  @Min(0)
  codAmount!: number;

  @ApiPropertyOptional({ example: "T-shirt and accessories" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  itemDescription?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(500)
  itemQuantity!: number;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  itemWeightKg!: number;

  @ApiPropertyOptional({ example: "Call before delivery." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstruction?: string;

  @ApiPropertyOptional({ type: ProviderOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderOptionsDto)
  providerOptions?: ProviderOptionsDto;
}

export class PhoneRiskQueryDto {
  @ApiProperty({ example: "01711111111" })
  @Matches(/^(\+?88)?01[3-9]\d{8}$/)
  phoneNumber!: string;
}

export class OrderListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CourierProvider)
  provider?: CourierProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class OrderIdParamDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;
}

export class ShipmentIdParamDto {
  @ApiProperty()
  @IsUUID()
  shipmentId!: string;
}
