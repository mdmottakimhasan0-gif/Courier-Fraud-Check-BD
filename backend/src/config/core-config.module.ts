import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { loadAppConfig } from "./app-config";
import { AppConfigService } from "./app-config.service";
import { APP_CONFIG } from "./config.tokens";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    })
  ],
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: loadAppConfig
    },
    AppConfigService
  ],
  exports: [AppConfigService]
})
export class CoreConfigModule {}
