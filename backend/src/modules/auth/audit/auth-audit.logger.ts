import { Injectable } from "@nestjs/common";
import type { AuthAuditEvent } from "../contracts/auth.types";

export interface AuthAuditLogger {
  record(event: AuthAuditEvent): Promise<void>;
}

@Injectable()
export class NullAuthAuditLogger implements AuthAuditLogger {
  record(_event: AuthAuditEvent): Promise<void> {
    return Promise.resolve();
  }
}
