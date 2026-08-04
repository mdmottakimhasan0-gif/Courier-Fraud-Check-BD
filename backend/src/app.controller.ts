import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { AppService } from "./app.service";

type FoundationStatus = {
  name: string;
  milestone: string;
  status: "ready";
};

@Controller({
  version: VERSION_NEUTRAL
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getFoundationStatus(): FoundationStatus {
    return this.appService.getFoundationStatus();
  }
}
