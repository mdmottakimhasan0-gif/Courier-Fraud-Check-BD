import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUserPrincipal } from "../../modules/auth/contracts/auth.types";

type AuthenticatedRequest = Request & {
  user?: AuthUserPrincipal;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUserPrincipal => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) {
    throw new UnauthorizedException("Authenticated user is not available on the request.");
  }

  return request.user;
});
