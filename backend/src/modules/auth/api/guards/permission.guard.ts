import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { REQUIRED_PERMISSIONS_METADATA } from "../../access-control/access-control.decorators";
import type { AuthUserPrincipal } from "../../contracts/auth.types";

type AuthenticatedRequest = Request & {
  user?: AuthUserPrincipal;
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(REQUIRED_PERMISSIONS_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.user?.permissions ?? [];
    if (!requiredPermissions.every((permission) => userPermissions.includes(permission))) {
      throw new ForbiddenException("User does not have required permissions.");
    }

    return true;
  }
}
