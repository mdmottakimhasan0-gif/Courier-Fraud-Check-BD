import { Injectable } from "@nestjs/common";
import type { JobsOptions } from "bullmq";
import { AppConfigService } from "../../config/app-config.service";

@Injectable()
export class QueueRetryPolicy {
  constructor(private readonly config: AppConfigService) {}

  defaultJobOptions(): JobsOptions {
    return {
      attempts: this.config.queue.defaultAttempts,
      backoff: {
        delay: this.config.queue.retryBackoffMs,
        type: "exponential"
      },
      removeOnComplete: 1000,
      removeOnFail: false
    };
  }
}
