import { Module } from "@nestjs/common";
import { QueueInfrastructureModule } from "../../infrastructure/queues/queue-infrastructure.module";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { RedisInfrastructureModule } from "../../infrastructure/redis/redis-infrastructure.module";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [PrismaModule, RedisInfrastructureModule, QueueInfrastructureModule],
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
