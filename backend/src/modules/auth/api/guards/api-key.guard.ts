import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { API_KEY_REPOSITORY } from "../../auth.tokens";
import { SecureTokenService } from "../../tokens/secure-token.service";
import type { ApiKeyPrincipal, ApiKeyRepository } from "../../repositories/api-key.repository";

type ApiKeyRequest = Request & {
  apiKey?: ApiKeyPrincipal;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: ApiKeyRepository,
    private readonly secureTokenService: SecureTokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const presentedKey = request.headers["x-api-key"]?.toString();
    if (!presentedKey) {
      throw new UnauthorizedException("API key is required.");
    }

    const publicPrefix = presentedKey.slice(0, 12);
    const principal = await this.apiKeyRepository.findByPublicPrefix(publicPrefix);
    const keyHash = principal ? await this.apiKeyRepository.getKeyHash(principal.id) : null;

    if (!principal || principal.status !== "active" || keyHash !== this.secureTokenService.hashToken(presentedKey)) {
      throw new UnauthorizedException("API key is invalid.");
    }

    request.apiKey = principal;
    await this.apiKeyRepository.recordLastUsed(principal.id, new Date());
    return true;
  }
}
