import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

type EncryptedPayload = {
  authTag: string;
  iv: string;
  value: string;
  version: 1;
};

@Injectable()
export class CredentialEncryptionService {
  encrypt(credentials: Record<string, unknown>): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const value = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
    const payload: EncryptedPayload = {
      authTag: cipher.getAuthTag().toString("base64"),
      iv: iv.toString("base64"),
      value: value.toString("base64"),
      version: 1
    };

    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  }

  decrypt(encryptedValue: string): Record<string, unknown> {
    const payload = JSON.parse(Buffer.from(encryptedValue, "base64").toString("utf8")) as EncryptedPayload;
    const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const value = Buffer.concat([decipher.update(Buffer.from(payload.value, "base64")), decipher.final()]);

    return JSON.parse(value.toString("utf8")) as Record<string, unknown>;
  }

  mask(credentials: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.keys(credentials).map((key) => [key, "********"]));
  }

  private key(): Buffer {
    const configured = process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (configured) {
      const decoded = Buffer.from(configured, "base64");
      if (decoded.length === 32) {
        return decoded;
      }
    }

    return createHash("sha256").update(configured ?? "development-credential-encryption-key").digest();
  }
}
