import { Module } from "@nestjs/common";
import { RedxProviderAdapter } from "./redx.provider";

@Module({
  providers: [RedxProviderAdapter],
  exports: [RedxProviderAdapter]
})
export class RedxProviderModule {}
