import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  ApiKeyStatus,
  ContentStatus,
  CourierAccountStatus,
  CourierProvider,
  Prisma,
  ProviderHealthStatus,
  UserStatus
} from "@prisma/client";
import { QueueHealthService } from "../../../../infrastructure/queues/queue-health.service";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import { CacheMetricsService } from "../../../../infrastructure/redis/cache/cache-metrics.service";
import { RedisHealthIndicator } from "../../../../infrastructure/redis/redis-health.indicator";
import { AuthenticationService } from "../../../auth/authentication.service";
import type { AuthUserPrincipal, DeviceDescriptor } from "../../../auth/contracts/auth.types";
import { Argon2idPasswordHasher } from "../../../auth/passwords/argon2id-password.hasher";
import { SecureTokenService } from "../../../auth/tokens/secure-token.service";
import { CredentialEncryptionService } from "../../security/credential-encryption.service";
import {
  AdminLoginDto,
  AdminResetUserPasswordDto,
  AnnouncementDto,
  ChangeUserRoleDto,
  CreateApiKeyDto,
  CreateManagedUserDto,
  CreateRoleDto,
  FeatureFlagDto,
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
} from "../dto/business-management.dto";
import { AdminAuditService } from "./admin-audit.service";

@Injectable()
export class BusinessManagementService {
  constructor(
    private readonly audit: AdminAuditService,
    private readonly cacheMetrics: CacheMetricsService,
    private readonly credentialEncryption: CredentialEncryptionService,
    private readonly passwordHasher: Argon2idPasswordHasher,
    private readonly prisma: PrismaService,
    private readonly queueHealth: QueueHealthService,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly secureTokenService: SecureTokenService,
    private readonly authenticationService: AuthenticationService
  ) {}

  async adminLogin(dto: AdminLoginDto, correlationId: string, device: DeviceDescriptor) {
    const result = await this.authenticationService.login({
      correlationId,
      device,
      email: dto.email,
      password: dto.password,
      tenantId: dto.tenantId
    });

    this.assertAdmin(result.user);
    return result;
  }

  getAdminProfile(user: AuthUserPrincipal): AuthUserPrincipal {
    this.assertAdmin(user);
    return user;
  }

  async adminLogout(user: AuthUserPrincipal, sessionId: string | undefined, correlationId: string): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException("Current session is not available.");
    }

    await this.authenticationService.logoutCurrentDevice(sessionId, {
      action: "auth.logout.current_device",
      actorId: user.id,
      correlationId,
      tenantId: user.tenantId
    });
  }

  async listUsers(query: UserListQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      status: query.status,
      tenantId: query.tenantId
    };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        where
      }),
      this.prisma.user.count({ where })
    ]);

    return { items: items.map((user) => this.safeUser(user)), total };
  }

  async getUser(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      include: { roles: { include: { role: true } } },
      where: { id, tenantId }
    });
    if (!user) {
      throw new NotFoundException("User was not found.");
    }

    return this.safeUser(user);
  }

  async createUser(actor: AuthUserPrincipal, dto: CreateManagedUserDto, correlationId: string) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email, tenantId: dto.tenantId } });
    if (existing) {
      throw new ConflictException("A user with this email already exists.");
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash: await this.passwordHasher.hash(dto.password),
        phone: dto.phone,
        status: dto.status ?? UserStatus.ACTIVE,
        tenantId: dto.tenantId
      }
    });
    await this.audit.record({
      action: "admin.user.created",
      actor,
      correlationId,
      newValue: this.toJson({ email, status: user.status }),
      resourceId: user.id,
      resourceType: "user"
    });

    return this.getUser(dto.tenantId, user.id);
  }

  async updateUser(actor: AuthUserPrincipal, tenantId: string, id: string, dto: UpdateManagedUserDto, correlationId: string) {
    const previous = await this.getUser(tenantId, id);
    await this.prisma.user.update({
      data: dto,
      where: { id }
    });
    await this.audit.record({
      action: "admin.user.updated",
      actor,
      correlationId,
      newValue: this.toJson(dto),
      previousValue: this.toJson(previous),
      resourceId: id,
      resourceType: "user"
    });

    return this.getUser(tenantId, id);
  }

  async setUserStatus(actor: AuthUserPrincipal, tenantId: string, id: string, status: UserStatus, correlationId: string) {
    await this.prisma.user.update({
      data: {
        lockedUntil: status === UserStatus.LOCKED ? new Date(Date.now() + 15 * 60 * 1000) : null,
        status
      },
      where: { id }
    });
    await this.audit.record({
      action: `admin.user.${status.toLowerCase()}`,
      actor,
      correlationId,
      newValue: this.toJson({ status }),
      resourceId: id,
      resourceType: "user"
    });

    return this.getUser(tenantId, id);
  }

  async softDeleteUser(actor: AuthUserPrincipal, tenantId: string, id: string, correlationId: string) {
    await this.prisma.user.update({
      data: { deletedAt: new Date(), status: UserStatus.DELETED },
      where: { id }
    });
    await this.audit.record({ action: "admin.user.deleted", actor, correlationId, resourceId: id, resourceType: "user" });
    return this.getUser(tenantId, id);
  }

  async restoreUser(actor: AuthUserPrincipal, tenantId: string, id: string, correlationId: string) {
    await this.prisma.user.update({
      data: { deletedAt: null, status: UserStatus.ACTIVE },
      where: { id }
    });
    await this.audit.record({ action: "admin.user.restored", actor, correlationId, resourceId: id, resourceType: "user" });
    return this.getUser(tenantId, id);
  }

  async changeUserRole(actor: AuthUserPrincipal, userId: string, dto: ChangeUserRoleDto, correlationId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: { roleId: dto.roleId, userId }
    });
    await this.prisma.user.update({ data: { permissionVersion: { increment: 1 } }, where: { id: userId } });
    await this.audit.record({ action: "admin.user.role_changed", actor, correlationId, resourceId: userId, resourceType: "user" });
  }

  async resetUserPassword(actor: AuthUserPrincipal, userId: string, dto: AdminResetUserPasswordDto, correlationId: string): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ data: { passwordHash, permissionVersion: { increment: 1 } }, where: { id: userId } }),
      this.prisma.passwordHistory.create({ data: { passwordHash, userId } })
    ]);
    await this.audit.record({ action: "admin.user.password_reset", actor, correlationId, resourceId: userId, resourceType: "user" });
  }

  async forceLogoutUser(actor: AuthUserPrincipal, userId: string, correlationId: string): Promise<void> {
    await this.prisma.authSession.updateMany({ data: { revokedAt: new Date() }, where: { userId, revokedAt: null } });
    await this.audit.record({ action: "admin.user.force_logout", actor, correlationId, resourceId: userId, resourceType: "user" });
  }

  async listRoles(query: PaginationQueryDto) {
    const where = { deletedAt: null, tenantId: query.tenantId };
    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 20,
        where
      }),
      this.prisma.role.count({ where })
    ]);
    return { items, total };
  }

  async createRole(actor: AuthUserPrincipal, dto: CreateRoleDto, correlationId: string) {
    const role = await this.prisma.role.create({ data: dto });
    await this.audit.record({ action: "admin.role.created", actor, correlationId, resourceId: role.id, resourceType: "role" });
    return role;
  }

  async updateRole(actor: AuthUserPrincipal, id: string, dto: UpdateRoleDto, correlationId: string) {
    const role = await this.prisma.role.update({ data: dto, where: { id } });
    await this.audit.record({ action: "admin.role.updated", actor, correlationId, resourceId: id, resourceType: "role" });
    return role;
  }

  async deleteRole(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const role = await this.prisma.role.update({ data: { deletedAt: new Date() }, where: { id } });
    await this.audit.record({ action: "admin.role.deleted", actor, correlationId, resourceId: id, resourceType: "role" });
    return role;
  }

  async assignPermissions(actor: AuthUserPrincipal, roleId: string, dto: PermissionIdsDto, correlationId: string): Promise<void> {
    await this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map((permissionId) => ({ permissionId, roleId })),
      skipDuplicates: true
    });
    await this.audit.record({ action: "admin.role.permissions_assigned", actor, correlationId, resourceId: roleId, resourceType: "role" });
  }

  async removePermissions(actor: AuthUserPrincipal, roleId: string, dto: PermissionIdsDto, correlationId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({ where: { permissionId: { in: dto.permissionIds }, roleId } });
    await this.audit.record({ action: "admin.role.permissions_removed", actor, correlationId, resourceId: roleId, resourceType: "role" });
  }

  async permissionCategories() {
    const permissions = await this.prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
    return Object.values(
      permissions.reduce<Record<string, { permissions: typeof permissions; resource: string }>>((groups, permission) => {
        const group = groups[permission.resource] ?? { permissions: [], resource: permission.resource };
        group.permissions.push(permission);
        groups[permission.resource] = group;
        return groups;
      }, {})
    );
  }

  permissionSearch(query: PermissionSearchQueryDto) {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
      where: {
        resource: query.resource,
        OR: query.search
          ? [
              { action: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { resource: { contains: query.search, mode: "insensitive" } }
            ]
          : undefined
      }
    });
  }

  async createCredential(actor: AuthUserPrincipal, dto: MerchantCredentialDto, correlationId: string) {
    const account = await this.prisma.courierAccount.create({
      data: {
        encryptedCredentials: this.credentialEncryption.encrypt(dto.credentials),
        label: dto.label,
        provider: dto.provider,
        status: CourierAccountStatus.UNVERIFIED,
        tenantId: dto.tenantId
      }
    });
    await this.audit.record({ action: "admin.courier_credential.created", actor, correlationId, resourceId: account.id, resourceType: "courier_account" });
    return this.safeCourierAccount(account, dto.credentials);
  }

  async updateCredential(actor: AuthUserPrincipal, id: string, dto: UpdateMerchantCredentialDto, correlationId: string) {
    const encryptedCredentials = dto.credentials ? this.credentialEncryption.encrypt(dto.credentials) : undefined;
    const account = await this.prisma.courierAccount.update({
      data: {
        credentialVersion: encryptedCredentials ? { increment: 1 } : undefined,
        encryptedCredentials,
        label: dto.label,
        status: encryptedCredentials ? CourierAccountStatus.UNVERIFIED : undefined
      },
      where: { id }
    });
    await this.audit.record({ action: "admin.courier_credential.updated", actor, correlationId, resourceId: id, resourceType: "courier_account" });
    return this.safeCourierAccount(account, dto.credentials);
  }

  async listCredentials(query: PaginationQueryDto) {
    const accounts = await this.prisma.courierAccount.findMany({
      orderBy: { createdAt: "desc" },
      skip: query.offset ?? 0,
      take: query.limit ?? 20,
      where: { deletedAt: null, tenantId: query.tenantId }
    });
    return accounts.map((account) => this.safeCourierAccount(account));
  }

  async deleteCredential(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const account = await this.prisma.courierAccount.update({ data: { deletedAt: new Date(), isActive: false }, where: { id } });
    await this.audit.record({ action: "admin.courier_credential.deleted", actor, correlationId, resourceId: id, resourceType: "courier_account" });
    return this.safeCourierAccount(account);
  }

  async setCredentialActive(actor: AuthUserPrincipal, id: string, isActive: boolean, correlationId: string) {
    const account = await this.prisma.courierAccount.update({ data: { isActive }, where: { id } });
    await this.audit.record({ action: isActive ? "admin.courier_credential.enabled" : "admin.courier_credential.disabled", actor, correlationId, resourceId: id, resourceType: "courier_account" });
    return this.safeCourierAccount(account);
  }

  async testCredential(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const account = await this.prisma.courierAccount.update({
      data: {
        healthStatus: ProviderHealthStatus.UNKNOWN,
        lastVerifiedAt: new Date(),
        status: CourierAccountStatus.UNVERIFIED
      },
      where: { id }
    });
    await this.audit.record({ action: "admin.courier_credential.test_requested", actor, correlationId, resourceId: id, resourceType: "courier_account" });
    return { account: this.safeCourierAccount(account), message: "Connection test recorded. Live provider handshake is deferred to the courier integration milestone." };
  }

  async createApiKey(actor: AuthUserPrincipal, dto: CreateApiKeyDto, correlationId: string) {
    const token = this.secureTokenService.generateOpaqueToken();
    const publicPrefix = token.slice(0, 12);
    const apiKey = await this.prisma.apiKey.create({
      data: {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        keyHash: this.secureTokenService.hashToken(token),
        name: dto.name,
        publicPrefix,
        scopes: dto.scopes,
        tenantId: dto.tenantId,
        userId: dto.userId
      }
    });
    await this.audit.record({ action: "admin.api_key.created", actor, correlationId, resourceId: apiKey.id, resourceType: "api_key" });
    return { apiKey: this.safeApiKey(apiKey), token };
  }

  async rotateApiKey(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const token = this.secureTokenService.generateOpaqueToken();
    const apiKey = await this.prisma.apiKey.update({
      data: {
        keyHash: this.secureTokenService.hashToken(token),
        publicPrefix: token.slice(0, 12),
        status: ApiKeyStatus.ACTIVE
      },
      where: { id }
    });
    await this.audit.record({ action: "admin.api_key.rotated", actor, correlationId, resourceId: id, resourceType: "api_key" });
    return { apiKey: this.safeApiKey(apiKey), token };
  }

  async revokeApiKey(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const apiKey = await this.prisma.apiKey.update({ data: { revokedAt: new Date(), status: ApiKeyStatus.REVOKED }, where: { id } });
    await this.audit.record({ action: "admin.api_key.revoked", actor, correlationId, resourceId: id, resourceType: "api_key" });
    return this.safeApiKey(apiKey);
  }

  async listApiKeys(query: PaginationQueryDto) {
    const items = await this.prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      skip: query.offset ?? 0,
      take: query.limit ?? 20,
      where: { deletedAt: null, tenantId: query.tenantId }
    });
    return items.map((item) => this.safeApiKey(item));
  }

  apiKeyUsageSummary(query: TenantQueryDto) {
    return this.prisma.apiKey.groupBy({
      _count: { _all: true },
      by: ["status"],
      where: { deletedAt: null, tenantId: query.tenantId }
    });
  }

  async listSearches(query: SearchLogQueryDto) {
    const where: Prisma.SearchHistoryWhereInput = {
      createdAt: { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined },
      deletedAt: null,
      normalizedPhone: query.phone,
      riskBadge: query.riskBadge,
      status: query.status,
      tenantId: query.tenantId,
      userId: query.userId,
      fraudResults: query.provider ? { some: { provider: query.provider } } : undefined
    };
    const [items, total] = await Promise.all([
      this.prisma.searchHistory.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where }),
      this.prisma.searchHistory.count({ where })
    ]);
    return { items, total };
  }

  async searchDetails(tenantId: string, id: string) {
    const search = await this.prisma.searchHistory.findFirst({
      include: { fraudResults: true, user: { select: { email: true, id: true, name: true } } },
      where: { id, tenantId }
    });
    if (!search) {
      throw new NotFoundException("Search was not found.");
    }
    return search;
  }

  async searchStatistics(query: TenantQueryDto) {
    const [total, byStatus, byRisk] = await Promise.all([
      this.prisma.searchHistory.count({ where: { tenantId: query.tenantId } }),
      this.prisma.searchHistory.groupBy({ _count: { _all: true }, by: ["status"], where: { tenantId: query.tenantId } }),
      this.prisma.searchHistory.groupBy({ _count: { _all: true }, by: ["riskBadge"], where: { tenantId: query.tenantId } })
    ]);
    return { byRisk, byStatus, total };
  }

  async dashboard(query: TenantQueryDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const [totalUsers, activeUsers, todaysSearches, monthlySearches, providerSuccessRate, riskDistribution, queues, redis] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: query.tenantId } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, tenantId: query.tenantId } }),
      this.prisma.searchHistory.count({ where: { createdAt: { gte: today }, tenantId: query.tenantId } }),
      this.prisma.searchHistory.count({ where: { createdAt: { gte: month }, tenantId: query.tenantId } }),
      this.prisma.fraudResult.groupBy({ _avg: { successRate: true }, by: ["provider"], where: { tenantId: query.tenantId } }),
      this.prisma.searchHistory.groupBy({ _count: { _all: true }, by: ["riskBadge"], where: { tenantId: query.tenantId } }),
      this.queueHealth.checkCoreQueues(),
      this.redisHealth.check()
    ]);
    const topActiveUsers = await this.prisma.searchHistory.groupBy({
      _count: { _all: true },
      by: ["userId"],
      orderBy: { _count: { userId: "desc" } },
      take: 10,
      where: { tenantId: query.tenantId, userId: { not: null } }
    });
    return {
      activeUsers,
      apiUsage: await this.apiKeyUsageSummary(query),
      cache: this.cacheMetrics.snapshot(),
      monthlySearches,
      providerSuccessRate,
      queues,
      redis,
      riskDistribution,
      todaySearches: todaysSearches,
      topActiveUsers,
      totalUsers
    };
  }

  async getSettings(query: TenantQueryDto, category: string) {
    return this.prisma.systemSetting.findMany({ where: { deletedAt: null, key: { startsWith: `${category}.` }, tenantId: query.tenantId } });
  }

  async updateSettings(actor: AuthUserPrincipal, category: string, dto: SettingUpdateDto, correlationId: string) {
    const key = `${category}.settings`;
    const setting = await this.prisma.systemSetting.upsert({
      create: { isSecret: category === "security", key, tenantId: dto.tenantId, value: this.toJson(dto.value) },
      update: { value: this.toJson(dto.value) },
      where: { tenantId_key: { key, tenantId: dto.tenantId } }
    });
    await this.audit.record({ action: `admin.settings.${category}.updated`, actor, correlationId, resourceId: setting.id, resourceType: "system_setting" });
    return setting;
  }

  listAuditLogs(query: PaginationQueryDto) {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where: { tenantId: query.tenantId } });
  }

  async getAuditLog(tenantId: string, id: string) {
    const log = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!log) {
      throw new NotFoundException("Audit log was not found.");
    }
    return log;
  }

  async createAnnouncement(actor: AuthUserPrincipal, dto: AnnouncementDto, correlationId: string) {
    const announcement = await this.prisma.announcement.create({ data: { ...dto, locale: dto.locale ?? "en" } });
    await this.audit.record({ action: "admin.announcement.created", actor, correlationId, resourceId: announcement.id, resourceType: "announcement" });
    return announcement;
  }

  async updateAnnouncement(actor: AuthUserPrincipal, id: string, dto: UpdateAnnouncementDto, correlationId: string) {
    const announcement = await this.prisma.announcement.update({ data: dto, where: { id } });
    await this.audit.record({ action: "admin.announcement.updated", actor, correlationId, resourceId: id, resourceType: "announcement" });
    return announcement;
  }

  async setAnnouncementPublished(actor: AuthUserPrincipal, id: string, publish: boolean, correlationId: string) {
    const announcement = await this.prisma.announcement.update({
      data: { publishedAt: publish ? new Date() : null, status: publish ? ContentStatus.PUBLISHED : ContentStatus.DRAFT },
      where: { id }
    });
    await this.audit.record({ action: publish ? "admin.announcement.published" : "admin.announcement.unpublished", actor, correlationId, resourceId: id, resourceType: "announcement" });
    return announcement;
  }

  async deleteAnnouncement(actor: AuthUserPrincipal, id: string, correlationId: string) {
    const announcement = await this.prisma.announcement.update({ data: { deletedAt: new Date() }, where: { id } });
    await this.audit.record({ action: "admin.announcement.deleted", actor, correlationId, resourceId: id, resourceType: "announcement" });
    return announcement;
  }

  listAnnouncements(query: PaginationQueryDto) {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where: { deletedAt: null, tenantId: query.tenantId } });
  }

  async createFeatureFlag(actor: AuthUserPrincipal, dto: FeatureFlagDto, correlationId: string) {
    const flag = await this.prisma.featureFlag.create({ data: { ...dto, rules: dto.rules ? this.toJson(dto.rules) : undefined } });
    await this.audit.record({ action: "admin.feature_flag.created", actor, correlationId, resourceId: flag.id, resourceType: "feature_flag" });
    return flag;
  }

  async updateFeatureFlag(actor: AuthUserPrincipal, id: string, dto: FeatureFlagDto, correlationId: string) {
    const flag = await this.prisma.featureFlag.update({ data: { ...dto, rules: dto.rules ? this.toJson(dto.rules) : undefined }, where: { id } });
    await this.audit.record({ action: "admin.feature_flag.updated", actor, correlationId, resourceId: id, resourceType: "feature_flag" });
    return flag;
  }

  async setFeatureFlagEnabled(actor: AuthUserPrincipal, id: string, enabled: boolean, correlationId: string) {
    const flag = await this.prisma.featureFlag.update({ data: { enabled }, where: { id } });
    await this.audit.record({ action: enabled ? "admin.feature_flag.enabled" : "admin.feature_flag.disabled", actor, correlationId, resourceId: id, resourceType: "feature_flag" });
    return flag;
  }

  listFeatureFlags(query: PaginationQueryDto) {
    return this.prisma.featureFlag.findMany({ orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 20, where: { deletedAt: null, tenantId: query.tenantId } });
  }

  private assertAdmin(user: AuthUserPrincipal): void {
    if (!user.roles.includes("super-admin") && !user.roles.includes("admin") && !user.permissions.includes("admin:manage")) {
      throw new ForbiddenException("Admin permission is required.");
    }
  }

  private safeApiKey(apiKey: { createdAt: Date; expiresAt: Date | null; id: string; lastUsedAt: Date | null; name: string; publicPrefix: string; scopes: string[]; status: ApiKeyStatus; userId: string | null }) {
    return {
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      id: apiKey.id,
      lastUsedAt: apiKey.lastUsedAt,
      name: apiKey.name,
      publicPrefix: apiKey.publicPrefix,
      scopes: apiKey.scopes,
      status: apiKey.status,
      userId: apiKey.userId
    };
  }

  private safeCourierAccount(account: { averageResponseTimeMs: number | null; circuitBreakerState: unknown; credentialVersion: number; failureRate: Prisma.Decimal | null; healthStatus: ProviderHealthStatus; id: string; isActive: boolean; label: string; lastFailureAt: Date | null; lastSuccessfulRequestAt: Date | null; lastVerifiedAt: Date | null; provider: CourierProvider; status: CourierAccountStatus }, credentials?: Record<string, unknown>) {
    return {
      averageResponseTimeMs: account.averageResponseTimeMs,
      circuitBreakerState: account.circuitBreakerState,
      credentialVersion: account.credentialVersion,
      credentials: credentials ? this.credentialEncryption.mask(credentials) : undefined,
      failureRate: account.failureRate ? Number(account.failureRate) : null,
      healthStatus: account.healthStatus,
      id: account.id,
      isActive: account.isActive,
      label: account.label,
      lastFailureAt: account.lastFailureAt,
      lastFailureReason: account.healthStatus === ProviderHealthStatus.OFFLINE ? "Provider health is offline." : null,
      lastSuccessfulConnectionAt: account.lastSuccessfulRequestAt,
      lastVerifiedAt: account.lastVerifiedAt,
      provider: account.provider,
      status: account.status
    };
  }

  private safeUser(user: { createdAt: Date; deletedAt: Date | null; email: string; emailVerifiedAt: Date | null; id: string; lastLoginAt: Date | null; locale: string; name: string; phone: string | null; roles?: Array<{ role: { id: string; name: string; slug: string } }>; status: UserStatus; tenantId: string; updatedAt: Date }) {
    return {
      createdAt: user.createdAt,
      deletedAt: user.deletedAt,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      id: user.id,
      lastLoginAt: user.lastLoginAt,
      locale: user.locale,
      name: user.name,
      phone: user.phone,
      roles: user.roles?.map((entry) => entry.role) ?? [],
      status: user.status,
      tenantId: user.tenantId,
      updatedAt: user.updatedAt
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
