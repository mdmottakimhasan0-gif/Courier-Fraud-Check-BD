import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig, AppEnvironment } from "./app-config";
import { APP_CONFIG } from "./config.tokens";

@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get apiVersion(): string {
    return this.config.apiVersion;
  }

  get appName(): string {
    return this.config.appName;
  }

  get corsOrigins(): string[] {
    return this.config.corsOrigins;
  }

  get environment(): AppEnvironment {
    return this.config.environment;
  }

  get port(): number {
    return this.config.port;
  }

  get queue(): AppConfig["queue"] {
    return this.config.queue;
  }

  get redis(): AppConfig["redis"] {
    return this.config.redis;
  }

  get requestBodyLimit(): string {
    return this.config.requestBodyLimit;
  }
}
