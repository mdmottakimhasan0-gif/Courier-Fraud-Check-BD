import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class SearchPhoneNumberRequestDto {
  @ApiProperty({ example: "01712345678" })
  @IsString()
  phoneNumber!: string;
}

export class SearchIdParamDto {
  @ApiProperty({ example: "7a8bf43c-89e5-4952-8e5c-bc5d40e62d16" })
  @IsUUID()
  searchId!: string;
}

export class SearchHistoryQueryDto {
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

  @ApiPropertyOptional({ example: "01712345678" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
