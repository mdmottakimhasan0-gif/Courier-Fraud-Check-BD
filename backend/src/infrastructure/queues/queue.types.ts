import type { JobsOptions } from "bullmq";

export type QueueName = "search" | "notifications" | "emails" | "scheduled" | "dead-letter";

export type QueueJob<TPayload = unknown> = {
  idempotencyKey?: string;
  name: string;
  options?: JobsOptions;
  payload: TPayload;
};

export type QueueHealthSnapshot = {
  delayed: number;
  failed: number;
  latencyMs?: number;
  name: QueueName;
  status: "ok" | "degraded";
  waiting: number;
};
