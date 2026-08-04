import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import type { Request } from "express";
import { CorrelationId } from "../../../common/decorators/correlation-id.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RateLimit } from "../../../common/rate-limiting/rate-limit.decorator";
import { apiResponse, type ApiResponsePayload } from "../../../common/responses/api-response.types";
import type { AuthUserPrincipal, DeviceDescriptor } from "../contracts/auth.types";
import { AuthApiService } from "./services/auth-api.service";
import {
  ChangePasswordRequestDto,
  EmailTokenRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ResendVerificationRequestDto,
  ResetPasswordRequestDto,
  RevokeSessionRequestDto,
  UpdateProfileRequestDto
} from "./dto/auth-api.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";

type RequestWithSession = Request & {
  refreshSessionId?: string;
  refreshToken?: string;
  sessionId?: string;
};

@ApiTags("Authentication")
@ApiBadRequestResponse({ description: "Validation error or invalid request." })
@ApiUnauthorizedResponse({ description: "Authentication failed." })
@ApiTooManyRequestsResponse({ description: "Endpoint rate limit exceeded." })
@Controller({
  path: "auth",
  version: "1"
})
export class AuthController {
  constructor(private readonly authApiService: AuthApiService) {}

  @Post("register")
  @RateLimit({ limit: 5, windowSeconds: 300 })
  @ApiOperation({ summary: "Register a pending user account." })
  @ApiOkResponse({ description: "User registered and verification token created." })
  async register(@Body() dto: RegisterRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.register(dto), "Registration completed. Verify email before login.");
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowSeconds: 300 })
  @ApiOperation({ summary: "Login with email and password." })
  @ApiOkResponse({ description: "Login succeeded and tokens were issued." })
  async login(
    @Body() dto: LoginRequestDto,
    @CorrelationId() correlationId: string,
    @Req() request: Request
  ): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.login(dto, correlationId, this.resolveDevice(request)), "Login successful.");
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @RateLimit({ limit: 30, windowSeconds: 300 })
  @ApiOperation({ summary: "Rotate refresh token and issue a new access token." })
  @ApiOkResponse({ description: "Refresh token rotated." })
  async refresh(@Body() _dto: RefreshTokenRequestDto, @Req() request: RequestWithSession): Promise<ApiResponsePayload> {
    return apiResponse(
      await this.authApiService.refresh(request.refreshSessionId ?? "", request.refreshToken ?? ""),
      "Token refreshed successfully."
    );
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout from the current device." })
  async logoutCurrentDevice(
    @CurrentUser() user: AuthUserPrincipal,
    @CorrelationId() correlationId: string,
    @Req() request: RequestWithSession
  ): Promise<ApiResponsePayload> {
    await this.authApiService.logoutCurrentDevice(user, request.sessionId, correlationId);
    return apiResponse(null, "Logged out from current device.");
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout from all devices." })
  async logoutAllDevices(@CurrentUser() user: AuthUserPrincipal, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.authApiService.logoutAllDevices(user, correlationId);
    return apiResponse(null, "Logged out from all devices.");
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 20, windowSeconds: 300 })
  @ApiOperation({ summary: "Verify an account email address." })
  async verifyEmail(@Body() dto: EmailTokenRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.verifyEmail(dto.token), "Email verified successfully.");
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowSeconds: 300 })
  @ApiOperation({ summary: "Create a new email verification token." })
  async resendVerification(@Body() dto: ResendVerificationRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.resendVerification(dto), "If the account exists, verification instructions were prepared.");
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowSeconds: 300 })
  @ApiOperation({ summary: "Create a password reset token." })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.forgotPassword(dto), "If the account exists, reset instructions were prepared.");
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowSeconds: 300 })
  @ApiOperation({ summary: "Reset password using a reset token." })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.resetPassword(dto), "Password reset successfully.");
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change current authenticated user's password." })
  async changePassword(@CurrentUser() user: AuthUserPrincipal, @Body() dto: ChangePasswordRequestDto): Promise<ApiResponsePayload> {
    await this.authApiService.changePassword(user, dto);
    return apiResponse(null, "Password changed successfully.");
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile." })
  async getProfile(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.getProfile(user), "Profile loaded.");
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile." })
  async updateProfile(@CurrentUser() user: AuthUserPrincipal, @Body() dto: UpdateProfileRequestDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.updateProfile(user, dto), "Profile updated.");
  }

  @Get("sessions/current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current device session." })
  async getCurrentSession(@Req() request: RequestWithSession): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.getCurrentSession(request.sessionId), "Current session loaded.");
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List active user sessions." })
  async listActiveSessions(@CurrentUser() user: AuthUserPrincipal): Promise<ApiResponsePayload> {
    return apiResponse(await this.authApiService.listActiveSessions(user), "Active sessions loaded.");
  }

  @Delete("sessions")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke an active session." })
  async revokeSession(@CurrentUser() user: AuthUserPrincipal, @Body() dto: RevokeSessionRequestDto): Promise<ApiResponsePayload> {
    await this.authApiService.revokeSession(user, dto.sessionId);
    return apiResponse(null, "Session revoked.");
  }

  private resolveDevice(request: Request): DeviceDescriptor {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]
    };
  }
}
