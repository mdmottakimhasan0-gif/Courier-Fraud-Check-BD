import { Module } from "@nestjs/common";
import { QueueInfrastructureModule } from "../../infrastructure/queues/queue-infrastructure.module";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { RedisInfrastructureModule } from "../../infrastructure/redis/redis-infrastructure.module";
import { AuthModule } from "../auth/auth.module";
import { BusinessManagementController } from "./api/business-management.controller";
import { AdminAuditService } from "./api/services/admin-audit.service";
import { BusinessManagementService } from "./api/services/business-management.service";
import { CredentialEncryptionService } from "./security/credential-encryption.service";

@Module({
  imports: [AuthModule, PrismaModule, QueueInfrastructureModule, RedisInfrastructureModule],
  controllers: [BusinessManagementController],
  providers: [AdminAuditService, BusinessManagementService, CredentialEncryptionService],
  exports: [AdminAuditService]
})
export class BusinessManagementModule {}
