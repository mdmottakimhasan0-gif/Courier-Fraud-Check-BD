import { Injectable } from "@nestjs/common";
import type { AuthUserPrincipal, PermissionCheck } from "../contracts/auth.types";

@Injectable()
export class AccessControlService {
  assertAllowed(principal: AuthUserPrincipal, check: PermissionCheck): void {
    if (check.requiredRoles?.length && !check.requiredRoles.some((role) => principal.roles.includes(role))) {
      throw new Error("User does not have a required role.");
    }

    const hasPermissions = check.requiredPermissions.every((permission) =>
      principal.permissions.includes(permission)
    );

    if (!hasPermissions) {
      throw new Error("User does not have required permissions.");
    }
  }
}
