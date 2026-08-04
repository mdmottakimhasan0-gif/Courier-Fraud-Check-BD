import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/prisma/prisma.service";
import type { AuthUserPrincipal } from "../../../auth/contracts/auth.types";

export type AdminAuditInput = {
  action: string;
  actor: AuthUserPrincipal;
  correlationId: string;
  newValue?: Prisma.InputJsonValue;
  previousValue?: Prisma.InputJsonValue;
  reason?: string;
  resourceId?: string;
  resourceType: string;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AdminAuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actor.id,
        actorRole: input.actor.roles[0],
        correlationId: input.correlationId,
        newValue: input.newValue,
        previousValue: input.previousValue,
        reason: input.reason,
        resourceId: input.resourceId,
        resourceType: input.resourceType,
        tenantId: input.actor.tenantId
      }
    });
  }
}
