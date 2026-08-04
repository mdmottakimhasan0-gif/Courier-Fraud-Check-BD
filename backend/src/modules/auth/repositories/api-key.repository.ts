export type ApiKeyPrincipal = {
  id: string;
  permissions: string[];
  status: "active" | "revoked" | "expired";
  tenantId: string;
  userId?: string;
};

export interface ApiKeyRepository {
  findByPublicPrefix(publicPrefix: string): Promise<ApiKeyPrincipal | null>;
  getKeyHash(apiKeyId: string): Promise<string | null>;
  recordLastUsed(apiKeyId: string, usedAt: Date): Promise<void>;
}
