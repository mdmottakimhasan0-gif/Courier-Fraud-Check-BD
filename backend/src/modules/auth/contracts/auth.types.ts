export type AuthUserStatus = "pending" | "active" | "locked" | "suspended" | "banned" | "deleted";

export type AuthUserPrincipal = {
  email: string;
  id: string;
  permissionVersion: number;
  permissions: string[];
  roles: string[];
  status: AuthUserStatus;
  tenantId: string;
};

export type DeviceDescriptor = {
  browser?: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type TokenPair = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type AuthSession = {
  createdAt: Date;
  device: DeviceDescriptor;
  expiresAt: Date;
  id: string;
  refreshTokenHash: string;
  revokedAt?: Date;
  tenantId: string;
  userId: string;
};

export type AuthAuditAction =
  | "auth.login.succeeded"
  | "auth.login.failed"
  | "auth.logout.current_device"
  | "auth.logout.all_devices"
  | "auth.refresh.rotated"
  | "auth.email_verification.requested"
  | "auth.email_verification.completed"
  | "auth.password_reset.requested"
  | "auth.password_reset.completed"
  | "auth.account.locked"
  | "auth.mfa.challenge_required"
  | "auth.mfa.enabled"
  | "auth.mfa.disabled"
  | "auth.email_change.requested"
  | "auth.email_change.completed"
  | "auth.suspicious_login.detected";

export type AuthAuditEvent = {
  action: AuthAuditAction;
  actorId?: string;
  correlationId: string;
  device?: DeviceDescriptor;
  metadata?: Readonly<Record<string, unknown>>;
  tenantId?: string;
};

export type PermissionCheck = {
  requiredPermissions: string[];
  requiredRoles?: string[];
};
