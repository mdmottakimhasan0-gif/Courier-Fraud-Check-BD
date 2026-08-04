import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { AppConfigService } from "../../config/app-config.service";

@Injectable()
export class RedisConnectionManager implements OnModuleDestroy {
  private client?: Redis;

  constructor(private readonly config: AppConfigService) {}

  getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(this.config.redis.url, {
        enableReadyCheck: true,
        keyPrefix: `${this.config.redis.keyPrefix}:`,
        lazyConnect: true,
        maxRetriesPerRequest: 2
      });
    }

    return this.client;
  }

  createIsolatedClient(): Redis {
    return new Redis(this.config.redis.url, {
      enableReadyCheck: true,
      keyPrefix: `${this.config.redis.keyPrefix}:`,
      lazyConnect: true,
      maxRetriesPerRequest: null
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
