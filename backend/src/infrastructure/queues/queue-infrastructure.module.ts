import { Global, Module } from "@nestjs/common";
import { CoreConfigModule } from "../../config/core-config.module";
import { RedisInfrastructureModule } from "../redis/redis-infrastructure.module";
import { DeadLetterQueueService } from "./dead-letter-queue.service";
import { QueueHealthService } from "./queue-health.service";
import { QueueManagerService } from "./queue-manager.service";
import { QueueRetryPolicy } from "./retry-policy.service";
import { WorkerManagerService } from "./worker-manager.service";

@Global()
@Module({
  imports: [CoreConfigModule, RedisInfrastructureModule],
  providers: [QueueRetryPolicy, QueueManagerService, DeadLetterQueueService, WorkerManagerService, QueueHealthService],
  exports: [QueueRetryPolicy, QueueManagerService, DeadLetterQueueService, WorkerManagerService, QueueHealthService]
})
export class QueueInfrastructureModule {}
