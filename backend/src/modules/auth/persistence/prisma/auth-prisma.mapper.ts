import type { ApiKeyStatus, UserStatus } from "@prisma/client";
import type { ApiKeyPrincipal } from "../../repositories/api-key.repository";
import type { AuthSession, AuthUserPrincipal, AuthUserStatus, DeviceDescriptor } from "../../contracts/auth.types";

export type PrismaUserPrincipalRecord = {
  email: string;
  id: string;
  permissionVersion: number;
  roles: Array<{
    role: {
      permissions: Array<{
        permission: {
          action: string;
          resource: string;
        };
      }>;
      slug: string;
    };
  }>;
  status: UserStatus;
  tenantId: string;
};

export type PrismaAuthSessionRecord = {
  createdAt: Date;
  device: unknown;
  expiresAt: Date;
  id: string;
  refreshTokenHash: string;
  revokedAt: Date | null;
  tenantId: string;
  userId: string;
};

export type PrismaApiKeyRecord = {
  id: string;
  scopes: string[];
  status: ApiKeyStatus;
  tenantId: string;
  userId: string | null;
};

const userStatusMap: Record<UserStatus, AuthUserStatus> = {
  ACTIVE: "active",
  BANNED: "banned",
  DELETED: "deleted",
  LOCKED: "locked",
  PENDING: "pending",
  SUSPENDED: "suspended"
};

const apiKeyStatusMap: Record<ApiKeyStatus, ApiKeyPrincipal["status"]> = {
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked"
};

function normalizeDevice(device: unknown): DeviceDescriptor {
  if (!device || typeof device !== "object") {
    return {};
  }

  const input = device as Record<string, unknown>;
  return {
    browser: typeof input.browser === "string" ? input.browser : undefined,
    device: typeof input.device === "string" ? input.device : undefined,
    ipAddress: typeof input.ipAddress === "string" ? input.ipAddress : undefined,
    userAgent: typeof input.userAgent === "string" ? input.userAgent : undefined
  };
}

export function mapUserPrincipal(user: PrismaUserPrincipalRecord): AuthUserPrincipal {
  const roles = user.roles.map((entry) => entry.role.slug);
  const permissions = user.roles.flatMap((entry) =>
    entry.role.permissions.map((permissionEntry) => {
      const permission = permissionEntry.permission;
      return `${permission.resource}:${permission.action}`;
    })
  );

  return {
    email: user.email,
    id: user.id,
    permissionVersion: user.permissionVersion,
    permissions: Array.from(new Set(permissions)),
    roles: Array.from(new Set(roles)),
    status: userStatusMap[user.status],
    tenantId: user.tenantId
  };
}

export function mapAuthSession(session: PrismaAuthSessionRecord): AuthSession {
  return {
    createdAt: session.createdAt,
    device: normalizeDevice(session.device),
    expiresAt: session.expiresAt,
    id: session.id,
    refreshTokenHash: session.refreshTokenHash,
    revokedAt: session.revokedAt ?? undefined,
    tenantId: session.tenantId,
    userId: session.userId
  };
}

export function mapApiKeyPrincipal(apiKey: PrismaApiKeyRecord): ApiKeyPrincipal {
  return {
    id: apiKey.id,
    permissions: apiKey.scopes,
    status: apiKeyStatusMap[apiKey.status],
    tenantId: apiKey.tenantId,
    userId: apiKey.userId ?? undefined
  };
}
