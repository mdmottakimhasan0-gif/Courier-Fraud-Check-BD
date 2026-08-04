import { Injectable } from "@nestjs/common";
import { QueueManagerService } from "./queue-manager.service";
import type { QueueHealthSnapshot, QueueName } from "./queue.types";

@Injectable()
export class QueueHealthService {
  constructor(private readonly queueManager: QueueManagerService) {}

  async check(name: QueueName): Promise<QueueHealthSnapshot> {
    const startedAt = Date.now();

    try {
      const queue = this.queueManager.getQueue(name);
      const [waiting, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
      ]);

      return {
        delayed,
        failed,
        latencyMs: Date.now() - startedAt,
        name,
        status: "ok",
        waiting
      };
    } catch {
      return {
        delayed: 0,
        failed: 0,
        name,
        status: "degraded",
        waiting: 0
      };
    }
  }

  async checkCoreQueues(): Promise<QueueHealthSnapshot[]> {
    return Promise.all(["search", "notifications", "emails", "scheduled", "dead-letter"].map((name) => this.check(name as QueueName)));
  }
}
