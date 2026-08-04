import type { CourierProviderId } from "./courier-provider.types";

export type EncryptedCredentialEnvelope = {
  ciphertext: string;
  keyVersion: number;
  provider: CourierProviderId;
  tenantId: string;
};

export type ProviderCredentialMaterial = {
  provider: CourierProviderId;
  tenantId: string;
  values: Readonly<Record<string, string>>;
};

export interface ProviderCredentialReader {
  readEncryptedCredential(tenantId: string, provider: CourierProviderId): Promise<EncryptedCredentialEnvelope | null>;
}

export interface ProviderCredentialCipher {
  decrypt(envelope: EncryptedCredentialEnvelope): Promise<ProviderCredentialMaterial>;
}
