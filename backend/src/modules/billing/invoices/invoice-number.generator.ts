import { Injectable } from "@nestjs/common";

@Injectable()
export class InvoiceNumberGenerator {
  generate(tenantId: string, date = new Date()): string {
    const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
    return `INV-${stamp}-${tenantId.slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}
