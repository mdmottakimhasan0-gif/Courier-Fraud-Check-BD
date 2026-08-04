import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { RedisConnectionManager } from "../redis-connection.manager";

export type DistributedLock = {
  key: string;
  token: string;
};

@Injectable()
export class DistributedLockService {
  private readonly releaseScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    end
    return 0
  `;

  constructor(private readonly redis: RedisConnectionManager) {}

  async acquire(key: string, ttlMs: number): Promise<DistributedLock | null> {
    const token = randomUUID();
    const result = await this.redis.getClient().set(key, token, "PX", ttlMs, "NX");

    return result === "OK" ? { key, token } : null;
  }

  async release(lock: DistributedLock): Promise<boolean> {
    const result = await this.redis.getClient().eval(this.releaseScript, 1, lock.key, lock.token);
    return result === 1;
  }
}
