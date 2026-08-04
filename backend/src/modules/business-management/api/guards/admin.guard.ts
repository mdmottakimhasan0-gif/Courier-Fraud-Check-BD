import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUserPrincipal } from "../../../auth/contracts/auth.types";

type AdminRequest = Request & {
  user?: AuthUserPrincipal;
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const roles = request.user?.roles ?? [];
    const permissions = request.user?.permissions ?? [];
    const isAdmin = roles.includes("super-admin") || roles.includes("admin") || permissions.includes("admin:manage");

    if (!isAdmin) {
      throw new ForbiddenException("Admin permission is required.");
    }

    return true;
  }
}
