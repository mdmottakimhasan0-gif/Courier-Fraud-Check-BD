import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisConnectionManager } from "../redis/redis-connection.manager";
import type { QueueJob, QueueName } from "./queue.types";
import { QueueRetryPolicy } from "./retry-policy.service";

@Injectable()
export class QueueManagerService implements OnModuleDestroy {
  private readonly queues = new Map<QueueName, Queue>();

  constructor(
    private readonly redis: RedisConnectionManager,
    private readonly retryPolicy: QueueRetryPolicy
  ) {}

  getQueue(name: QueueName): Queue {
    const existing = this.queues.get(name);
    if (existing) {
      return existing;
    }

    const queue = new Queue(name, {
      connection: this.redis.createIsolatedClient(),
      defaultJobOptions: this.retryPolicy.defaultJobOptions()
    });
    this.queues.set(name, queue);
    return queue;
  }

  async add<TPayload>(queueName: QueueName, job: QueueJob<TPayload>): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(job.name, job.payload, {
      ...job.options,
      jobId: job.idempotencyKey ?? job.options?.jobId
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
  }
}
