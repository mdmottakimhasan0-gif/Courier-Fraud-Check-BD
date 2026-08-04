import { Injectable } from "@nestjs/common";
import {
  DistributedLock,
  DistributedLockService
} from "../../../infrastructure/redis/locks/distributed-lock.service";
import { SearchCacheKeyFactory } from "./search-cache-key.factory";

@Injectable()
export class DuplicateSearchPreventionService {
  private readonly lockTtlMs = 30_000;

  constructor(
    private readonly locks: DistributedLockService,
    private readonly keys: SearchCacheKeyFactory
  ) {}

  async acquire(tenantId: string, normalizedPhoneNumber: string): Promise<DistributedLock | null> {
    return this.locks.acquire(this.keys.duplicateLock(tenantId, normalizedPhoneNumber), this.lockTtlMs);
  }

  async release(lock: DistributedLock): Promise<boolean> {
    return this.locks.release(lock);
  }
}
