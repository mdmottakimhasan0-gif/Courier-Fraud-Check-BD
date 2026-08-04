import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserStatus } from "@prisma/client";
import type { Request } from "express";
import { CorrelationId } from "../../../common/decorators/correlation-id.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RateLimit } from "../../../common/rate-limiting/rate-limit.decorator";
import { apiResponse, type ApiResponsePayload } from "../../../common/responses/api-response.types";
import { JwtAuthGuard } from "../../auth/api/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/api/guards/permission.guard";
import { RoleGuard } from "../../auth/api/guards/role.guard";
import { RequirePermissions } from "../../auth/access-control/access-control.decorators";
import type { AuthUserPrincipal, DeviceDescriptor } from "../../auth/contracts/auth.types";
import { AdminGuard } from "./guards/admin.guard";
import { BusinessManagementService } from "./services/business-management.service";
import {
  AdminLoginDto,
  AdminResetUserPasswordDto,
  AnnouncementDto,
  ChangeUserRoleDto,
  CreateApiKeyDto,
  CreateManagedUserDto,
  CreateRoleDto,
  FeatureFlagDto,
  IdParamDto,
  MerchantCredentialDto,
  PaginationQueryDto,
  PermissionIdsDto,
  PermissionSearchQueryDto,
  SearchLogQueryDto,
  SettingUpdateDto,
  TenantQueryDto,
  UpdateAnnouncementDto,
  UpdateManagedUserDto,
  UpdateMerchantCredentialDto,
  UpdateRoleDto,
  UserListQueryDto
} from "./dto/business-management.dto";

type AdminRequest = Request & {
  sessionId?: string;
};

@ApiTags("Admin Business Management")
@Controller({
  path: "admin",
  version: "1"
})
export class BusinessManagementController {
  constructor(private readonly service: BusinessManagementService) {}

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowSeconds: 300 })
  @ApiOperation({ summary: "Admin login." })
  async adminLogin(@Body() dto: AdminLoginDto, @CorrelationId() correlationId: string, @Req() request: Request): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.adminLogin(dto, correlationId, this.resolveDevice(request)), "Admin login successful.");
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin logout." })
  async adminLogout(@CurrentUser() user: AuthUserPrincipal, @CorrelationId() correlationId: string, @Req() request: AdminRequest): Promise<ApiResponsePayload> {
    await this.service.adminLogout(user, request.sessionId, correlationId);
    return apiResponse(null, "Admin logged out.");
  }

  @Get("auth/profile")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current admin profile." })
  adminProfile(@CurrentUser() user: AuthUserPrincipal): ApiResponsePayload {
    return apiResponse(this.service.getAdminProfile(user), "Admin profile loaded.");
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List users." })
  async listUsers(@Query() query: UserListQueryDto): Promise<ApiResponsePayload> {
    const result = await this.service.listUsers(query);
    return apiResponse(result.items, "Users loaded.", { limit: query.limit ?? 20, offset: query.offset ?? 0, total: result.total });
  }

  @Get("users/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user details." })
  async getUser(@Query() query: TenantQueryDto, @Param() params: IdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.getUser(query.tenantId, params.id), "User loaded.");
  }

  @Post("users")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create user." })
  async createUser(@CurrentUser() user: AuthUserPrincipal, @Body() dto: CreateManagedUserDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createUser(user, dto, correlationId), "User created.");
  }

  @Patch("users/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user." })
  async updateUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @Body() dto: UpdateManagedUserDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateUser(user, query.tenantId, params.id, dto, correlationId), "User updated.");
  }

  @Delete("users/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:delete")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Soft delete user." })
  async deleteUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.softDeleteUser(user, query.tenantId, params.id, correlationId), "User deleted.");
  }

  @Post("users/:id/restore")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Restore user." })
  async restoreUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.restoreUser(user, query.tenantId, params.id, correlationId), "User restored.");
  }

  @Post("users/:id/lock")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lock user." })
  async lockUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setUserStatus(user, query.tenantId, params.id, UserStatus.LOCKED, correlationId), "User locked.");
  }

  @Post("users/:id/unlock")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unlock user." })
  async unlockUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setUserStatus(user, query.tenantId, params.id, UserStatus.ACTIVE, correlationId), "User unlocked.");
  }

  @Post("users/:id/suspend")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Suspend user." })
  async suspendUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setUserStatus(user, query.tenantId, params.id, UserStatus.SUSPENDED, correlationId), "User suspended.");
  }

  @Post("users/:id/activate")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Activate user." })
  async activateUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setUserStatus(user, query.tenantId, params.id, UserStatus.ACTIVE, correlationId), "User activated.");
  }

  @Post("users/:id/ban")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ban user." })
  async banUser(@CurrentUser() user: AuthUserPrincipal, @Query() query: TenantQueryDto, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setUserStatus(user, query.tenantId, params.id, UserStatus.BANNED, correlationId), "User banned.");
  }

  @Post("users/:id/roles")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:roles")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change user role." })
  async changeUserRole(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: ChangeUserRoleDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.service.changeUserRole(user, params.id, dto, correlationId);
    return apiResponse(null, "User role changed.");
  }

  @Post("users/:id/reset-password")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset user password as admin." })
  async resetUserPassword(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: AdminResetUserPasswordDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.service.resetUserPassword(user, params.id, dto, correlationId);
    return apiResponse(null, "User password reset.");
  }

  @Post("users/:id/force-logout")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("users:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Force logout user from all sessions." })
  async forceLogoutUser(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.service.forceLogoutUser(user, params.id, correlationId);
    return apiResponse(null, "User sessions revoked.");
  }

  @Get("roles")
  @UseGuards(JwtAuthGuard, AdminGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List roles." })
  async listRoles(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    const result = await this.service.listRoles(query);
    return apiResponse(result.items, "Roles loaded.", { limit: query.limit ?? 20, offset: query.offset ?? 0, total: result.total });
  }

  @Post("roles")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("roles:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create role." })
  async createRole(@CurrentUser() user: AuthUserPrincipal, @Body() dto: CreateRoleDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createRole(user, dto, correlationId), "Role created.");
  }

  @Patch("roles/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("roles:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update role." })
  async updateRole(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: UpdateRoleDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateRole(user, params.id, dto, correlationId), "Role updated.");
  }

  @Delete("roles/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("roles:write")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete role." })
  async deleteRole(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.deleteRole(user, params.id, correlationId), "Role deleted.");
  }

  @Post("roles/:id/permissions")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("roles:permissions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign permissions to role." })
  async assignPermissions(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: PermissionIdsDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.service.assignPermissions(user, params.id, dto, correlationId);
    return apiResponse(null, "Permissions assigned.");
  }

  @Delete("roles/:id/permissions")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("roles:permissions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove permissions from role." })
  async removePermissions(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: PermissionIdsDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    await this.service.removePermissions(user, params.id, dto, correlationId);
    return apiResponse(null, "Permissions removed.");
  }

  @Get("permissions/categories")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permission categories." })
  async permissionCategories(): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.permissionCategories(), "Permission categories loaded.");
  }

  @Get("permissions")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search permissions." })
  async permissionSearch(@Query() query: PermissionSearchQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.permissionSearch(query), "Permissions loaded.");
  }

  @Get("courier-credentials")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List courier merchant credentials." })
  async listCredentials(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listCredentials(query), "Courier credentials loaded.");
  }

  @Post("courier-credentials")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create courier merchant credentials." })
  async createCredential(@CurrentUser() user: AuthUserPrincipal, @Body() dto: MerchantCredentialDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createCredential(user, dto, correlationId), "Courier credential created.");
  }

  @Patch("courier-credentials/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update courier merchant credentials." })
  async updateCredential(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: UpdateMerchantCredentialDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateCredential(user, params.id, dto, correlationId), "Courier credential updated.");
  }

  @Delete("courier-credentials/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete courier merchant credentials." })
  async deleteCredential(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.deleteCredential(user, params.id, correlationId), "Courier credential deleted.");
  }

  @Post("courier-credentials/:id/test")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Test courier merchant credential connection." })
  async testCredential(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.testCredential(user, params.id, correlationId), "Courier credential test recorded.");
  }

  @Post("courier-credentials/:id/enable")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable courier provider account." })
  async enableCredential(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setCredentialActive(user, params.id, true, correlationId), "Courier credential enabled.");
  }

  @Post("courier-credentials/:id/disable")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable courier provider account." })
  async disableCredential(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setCredentialActive(user, params.id, false, correlationId), "Courier credential disabled.");
  }

  @Get("courier-credentials/:id/health")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("courier-credentials:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get courier credential health status." })
  async credentialHealth(@Param() params: IdParamDto, @Query() query: TenantQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listCredentials({ ...query, limit: 100, offset: 0 }).then((items) => items.find((item) => item.id === params.id) ?? null), "Courier credential health loaded.");
  }

  @Get("api-keys")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("api-keys:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List API keys." })
  async listApiKeys(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listApiKeys(query), "API keys loaded.");
  }

  @Post("api-keys")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("api-keys:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create API key." })
  async createApiKey(@CurrentUser() user: AuthUserPrincipal, @Body() dto: CreateApiKeyDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createApiKey(user, dto, correlationId), "API key created.");
  }

  @Post("api-keys/:id/rotate")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("api-keys:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Rotate API key." })
  async rotateApiKey(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.rotateApiKey(user, params.id, correlationId), "API key rotated.");
  }

  @Post("api-keys/:id/revoke")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("api-keys:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke API key." })
  async revokeApiKey(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.revokeApiKey(user, params.id, correlationId), "API key revoked.");
  }

  @Get("api-keys/usage-summary")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("api-keys:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get API key usage summary." })
  async apiKeyUsageSummary(@Query() query: TenantQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.apiKeyUsageSummary(query), "API key usage summary loaded.");
  }

  @Get("searches")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("searches:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List search logs." })
  async listSearches(@Query() query: SearchLogQueryDto): Promise<ApiResponsePayload> {
    const result = await this.service.listSearches(query);
    return apiResponse(result.items, "Search logs loaded.", { limit: query.limit ?? 20, offset: query.offset ?? 0, total: result.total });
  }

  @Get("searches/statistics")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("searches:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get search statistics." })
  async searchStatistics(@Query() query: TenantQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.searchStatistics(query), "Search statistics loaded.");
  }

  @Get("searches/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("searches:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get search details." })
  async searchDetails(@Query() query: TenantQueryDto, @Param() params: IdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.searchDetails(query.tenantId, params.id), "Search details loaded.");
  }

  @Get("dashboard")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get dashboard statistics." })
  async dashboard(@Query() query: TenantQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.dashboard(query), "Dashboard statistics loaded.");
  }

  @Get("settings/:category")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("settings:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get settings by category." })
  async getSettings(@Query() query: TenantQueryDto, @Param("category") category: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.getSettings(query, category), "Settings loaded.");
  }

  @Patch("settings/:category")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("settings:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update settings by category." })
  async updateSettings(@CurrentUser() user: AuthUserPrincipal, @Param("category") category: string, @Body() dto: SettingUpdateDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateSettings(user, category, dto, correlationId), "Settings updated.");
  }

  @Get("audit-logs")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("audit-logs:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List audit logs." })
  async listAuditLogs(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listAuditLogs(query), "Audit logs loaded.");
  }

  @Get("audit-logs/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("audit-logs:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get audit log details." })
  async getAuditLog(@Query() query: TenantQueryDto, @Param() params: IdParamDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.getAuditLog(query.tenantId, params.id), "Audit log loaded.");
  }

  @Get("announcements")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List announcements." })
  async listAnnouncements(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listAnnouncements(query), "Announcements loaded.");
  }

  @Post("announcements")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create announcement." })
  async createAnnouncement(@CurrentUser() user: AuthUserPrincipal, @Body() dto: AnnouncementDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createAnnouncement(user, dto, correlationId), "Announcement created.");
  }

  @Patch("announcements/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update announcement." })
  async updateAnnouncement(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: UpdateAnnouncementDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateAnnouncement(user, params.id, dto, correlationId), "Announcement updated.");
  }

  @Delete("announcements/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete announcement." })
  async deleteAnnouncement(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.deleteAnnouncement(user, params.id, correlationId), "Announcement deleted.");
  }

  @Post("announcements/:id/publish")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish announcement." })
  async publishAnnouncement(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setAnnouncementPublished(user, params.id, true, correlationId), "Announcement published.");
  }

  @Post("announcements/:id/unpublish")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("announcements:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unpublish announcement." })
  async unpublishAnnouncement(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setAnnouncementPublished(user, params.id, false, correlationId), "Announcement unpublished.");
  }

  @Get("feature-flags")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("feature-flags:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List feature flags." })
  async listFeatureFlags(@Query() query: PaginationQueryDto): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.listFeatureFlags(query), "Feature flags loaded.");
  }

  @Post("feature-flags")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("feature-flags:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create feature flag." })
  async createFeatureFlag(@CurrentUser() user: AuthUserPrincipal, @Body() dto: FeatureFlagDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.createFeatureFlag(user, dto, correlationId), "Feature flag created.");
  }

  @Patch("feature-flags/:id")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("feature-flags:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update feature flag." })
  async updateFeatureFlag(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @Body() dto: FeatureFlagDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.updateFeatureFlag(user, params.id, dto, correlationId), "Feature flag updated.");
  }

  @Post("feature-flags/:id/enable")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("feature-flags:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable feature flag." })
  async enableFeatureFlag(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setFeatureFlagEnabled(user, params.id, true, correlationId), "Feature flag enabled.");
  }

  @Post("feature-flags/:id/disable")
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
  @RequirePermissions("feature-flags:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable feature flag." })
  async disableFeatureFlag(@CurrentUser() user: AuthUserPrincipal, @Param() params: IdParamDto, @CorrelationId() correlationId: string): Promise<ApiResponsePayload> {
    return apiResponse(await this.service.setFeatureFlagEnabled(user, params.id, false, correlationId), "Feature flag disabled.");
  }

  private resolveDevice(request: Request): DeviceDescriptor {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]
    };
  }
}
