import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUserPrincipal } from "../../auth/contracts/auth.types";
import { SubscriptionLimitService } from "./subscription-limit.service";

type SubscriptionRequest = Request & {
  user?: AuthUserPrincipal;
};

@Injectable()
export class SubscriptionEnforcementGuard implements CanActivate {
  constructor(private readonly limits: SubscriptionLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SubscriptionRequest>();
    if (request.user) {
      await this.limits.assertFraudSearchAllowed(request.user.tenantId, request.user.id);
    }

    return true;
  }
}
