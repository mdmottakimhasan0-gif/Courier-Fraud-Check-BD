import { SetMetadata } from "@nestjs/common";

export const REQUIRED_ROLES_METADATA = "auth:required_roles";
export const REQUIRED_PERMISSIONS_METADATA = "auth:required_permissions";

export function RequireRoles(...roles: string[]): ReturnType<typeof SetMetadata> {
  return SetMetadata(REQUIRED_ROLES_METADATA, roles);
}

export function RequirePermissions(...permissions: string[]): ReturnType<typeof SetMetadata> {
  return SetMetadata(REQUIRED_PERMISSIONS_METADATA, permissions);
}
