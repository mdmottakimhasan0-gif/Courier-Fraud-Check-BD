import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { RedisConnectionManager } from "../redis/redis-connection.manager";
import { DeadLetterQueueService } from "./dead-letter-queue.service";
import type { QueueName } from "./queue.types";

export type QueueJobHandler<TPayload = unknown> = (job: Job<TPayload>) => Promise<void>;

@Injectable()
export class WorkerManagerService implements OnModuleDestroy {
  private readonly workers = new Map<string, Worker>();

  constructor(
    private readonly deadLetterQueue: DeadLetterQueueService,
    private readonly redis: RedisConnectionManager
  ) {}

  register<TPayload>(queueName: QueueName, workerName: string, handler: QueueJobHandler<TPayload>): Worker {
    const key = `${queueName}:${workerName}`;
    const existing = this.workers.get(key);
    if (existing) {
      return existing;
    }

    const worker = new Worker<TPayload>(
      queueName,
      async (job) => {
        await handler(job);
      },
      {
        connection: this.redis.createIsolatedClient()
      }
    );

    worker.on("failed", (job, error) => {
      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        void this.deadLetterQueue.moveFailedJob(job, error.message);
      }
    });

    this.workers.set(key, worker);
    return worker;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Array.from(this.workers.values()).map((worker) => worker.close()));
  }
}
