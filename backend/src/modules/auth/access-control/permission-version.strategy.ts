import { Injectable } from "@nestjs/common";
import type { AuthUserPrincipal } from "../contracts/auth.types";

export type PermissionVersionClaim = {
  permissionVersion: number;
  userId: string;
};

@Injectable()
export class PermissionVersionStrategy {
  assertTokenVersionIsCurrent(claim: PermissionVersionClaim, user: AuthUserPrincipal): void {
    if (claim.userId !== user.id || claim.permissionVersion !== user.permissionVersion) {
      throw new Error("Token permissions are stale and require reauthentication.");
    }
  }
}
