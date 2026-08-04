import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { ApiKeyPrincipal, ApiKeyRepository } from "../../repositories/api-key.repository";
import { mapApiKeyPrincipal } from "./auth-prisma.mapper";

@Injectable()
export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPublicPrefix(publicPrefix: string): Promise<ApiKeyPrincipal | null> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        deletedAt: null,
        publicPrefix
      }
    });

    return apiKey ? mapApiKeyPrincipal(apiKey) : null;
  }

  async getKeyHash(apiKeyId: string): Promise<string | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      select: { keyHash: true },
      where: { id: apiKeyId }
    });

    return apiKey?.keyHash ?? null;
  }

  async recordLastUsed(apiKeyId: string, usedAt: Date): Promise<void> {
    await this.prisma.apiKey.update({
      data: { lastUsedAt: usedAt },
      where: { id: apiKeyId }
    });
  }
}
