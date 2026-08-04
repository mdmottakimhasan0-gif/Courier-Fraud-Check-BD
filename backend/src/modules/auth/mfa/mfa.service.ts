import { Injectable } from "@nestjs/common";
import { SecureTokenService } from "../tokens/secure-token.service";

@Injectable()
export class MfaService {
  constructor(private readonly secureTokenService: SecureTokenService) {}

  hashRecoveryCode(code: string): string {
    return this.secureTokenService.hashToken(code);
  }

  generateRecoveryCodes(count = 10): string[] {
    return Array.from({ length: count }, () => this.secureTokenService.generateOpaqueToken(12));
  }

  isMfaRequired(enabledFactorCount: number): boolean {
    return enabledFactorCount > 0;
  }
}
