import { IsString, IsUUID, Matches } from "class-validator";

export class FraudSearchRequestDto {
  @IsString()
  correlationId!: string;

  @IsString()
  @Matches(/^(\+?88)?01[3-9]\d{8}$/)
  phoneNumber!: string;

  @IsUUID()
  tenantId!: string;
}
