import type { ApiKeyPrincipal } from "../repositories/api-key.repository";

export interface ApiKeyAuthenticator {
  authenticate(rawApiKey: string): Promise<ApiKeyPrincipal>;
}
