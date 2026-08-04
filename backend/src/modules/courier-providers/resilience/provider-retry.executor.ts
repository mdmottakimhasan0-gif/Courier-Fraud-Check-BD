import { Injectable } from "@nestjs/common";
import type { ProviderRetryPolicy } from "../contracts/provider-config.interface";

type RetryableOperation<T> = () => Promise<T>;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

@Injectable()
export class ProviderRetryExecutor {
  async run<T>(operation: RetryableOperation<T>, policy: ProviderRetryPolicy): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < policy.maxAttempts) {
          await wait(policy.backoffMs * attempt);
        }
      }
    }

    throw lastError;
  }
}
