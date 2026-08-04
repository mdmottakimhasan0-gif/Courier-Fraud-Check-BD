import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { HealthSnapshot } from "./health.service";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller({
  path: "health",
  version: "1"
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Get aggregate application and infrastructure health." })
  getHealth(): Promise<HealthSnapshot> {
    return this.healthService.getHealth();
  }

  @Get("application")
  @ApiOperation({ summary: "Get application process health." })
  getApplicationHealth(): Omit<HealthSnapshot, "queues" | "redis" | "cache"> {
    return this.healthService.getApplicationHealth();
  }

  @Get("database")
  @ApiOperation({ summary: "Get database health." })
  getDatabaseHealth(): Promise<{ latencyMs?: number; status: "ok" | "degraded" }> {
    return this.healthService.getDatabaseHealth();
  }

  @Get("redis")
  @ApiOperation({ summary: "Get Redis health." })
  getRedisHealth(): ReturnType<HealthService["getRedisHealth"]> {
    return this.healthService.getRedisHealth();
  }

  @Get("queues")
  @ApiOperation({ summary: "Get queue health." })
  getQueueHealth(): ReturnType<HealthService["getQueueHealth"]> {
    return this.healthService.getQueueHealth();
  }
}
