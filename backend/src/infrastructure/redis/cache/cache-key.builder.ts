import { Injectable } from "@nestjs/common";

@Injectable()
export class CacheKeyBuilder {
  build(parts: readonly string[]): string {
    return parts.map((part) => this.normalizePart(part)).join(":");
  }

  tenantScoped(tenantId: string, parts: readonly string[]): string {
    return this.build(["tenant", tenantId, ...parts]);
  }

  private normalizePart(part: string): string {
    return part.trim().replaceAll(/\s+/g, "-").toLowerCase();
  }
}
