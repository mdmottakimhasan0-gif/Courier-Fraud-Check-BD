import { Injectable } from "@nestjs/common";
import type { Job } from "bullmq";
import { QueueManagerService } from "./queue-manager.service";

@Injectable()
export class DeadLetterQueueService {
  constructor(private readonly queueManager: QueueManagerService) {}

  async moveFailedJob(job: Job, reason: string): Promise<void> {
    await this.queueManager.add("dead-letter", {
      idempotencyKey: `dlq:${job.queueName}:${job.id ?? job.name}`,
      name: "failed-job",
      payload: {
        attemptsMade: job.attemptsMade,
        failedReason: reason,
        originalJobId: job.id,
        originalJobName: job.name,
        originalQueue: job.queueName,
        payload: job.data
      }
    });
  }
}
