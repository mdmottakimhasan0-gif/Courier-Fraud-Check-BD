import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsUUID, Length, MinLength } from "class-validator";

export class RegisterRequestDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "Merchant Owner" })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: "owner@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: "+8801712345678" })
  @IsOptional()
  @IsString()
  @Length(8, 32)
  phone?: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginRequestDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "owner@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  password!: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({ example: "12a9bc69-0f2a-4055-a489-e580ff9759e1" })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ example: "opaque-refresh-token" })
  @IsString()
  refreshToken!: string;
}

export class EmailTokenRequestDto {
  @ApiProperty({ example: "opaque-verification-token" })
  @IsString()
  token!: string;
}

export class ResendVerificationRequestDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "owner@example.com" })
  @IsEmail()
  email!: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: "4bdf7d75-c5c7-4f03-98ff-ea97e70b4f4a" })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "owner@example.com" })
  @IsEmail()
  email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ example: "opaque-reset-token" })
  @IsString()
  token!: string;

  @ApiProperty({ example: "NewStrongPass123!" })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class ChangePasswordRequestDto {
  @ApiProperty({ example: "CurrentStrongPass123!" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: "NewStrongPass123!" })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UpdateProfileRequestDto {
  @ApiPropertyOptional({ example: "Merchant Owner" })
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

export class RevokeSessionRequestDto {
  @ApiProperty({ example: "12a9bc69-0f2a-4055-a489-e580ff9759e1" })
  @IsUUID()
  sessionId!: string;
}
