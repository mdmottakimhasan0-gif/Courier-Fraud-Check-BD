import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY } from "../auth.tokens";
import type { AuthSession, DeviceDescriptor } from "../contracts/auth.types";
import type { AuthSessionRepository } from "../repositories/auth-session.repository";

@Injectable()
export class SessionManagementService {
  constructor(@Inject(AUTH_SESSION_REPOSITORY) private readonly sessionRepository: AuthSessionRepository) {}

  createSession(userId: string, tenantId: string, refreshTokenHash: string, expiresAt: Date, device: DeviceDescriptor): Promise<AuthSession> {
    return this.sessionRepository.create({
      device,
      expiresAt,
      refreshTokenHash,
      tenantId,
      userId
    });
  }

  logoutCurrentDevice(sessionId: string): Promise<void> {
    return this.sessionRepository.revokeById(sessionId, new Date());
  }

  logoutAllDevices(userId: string): Promise<void> {
    return this.sessionRepository.revokeAllForUser(userId, new Date());
  }
}
