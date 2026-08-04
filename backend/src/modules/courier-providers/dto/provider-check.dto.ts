import { IsString, IsUUID, Matches } from "class-validator";

export class ProviderCheckDto {
  @IsString()
  @Matches(/^01[3-9]\d{8}$/)
  phoneNumber!: string;

  @IsUUID()
  tenantId!: string;

  @IsString()
  correlationId!: string;
}
