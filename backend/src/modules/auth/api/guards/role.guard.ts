import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { REQUIRED_ROLES_METADATA } from "../../access-control/access-control.decorators";
import type { AuthUserPrincipal } from "../../contracts/auth.types";

type AuthenticatedRequest = Request & {
  user?: AuthUserPrincipal;
};

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(REQUIRED_ROLES_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = request.user?.roles ?? [];
    if (!requiredRoles.some((role) => userRoles.includes(role))) {
      throw new ForbiddenException("User does not have a required role.");
    }

    return true;
  }
}
