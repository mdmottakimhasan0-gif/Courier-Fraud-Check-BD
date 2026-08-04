import { Module } from "@nestjs/common";
import { PathaoProviderAdapter } from "./pathao.provider";

@Module({
  providers: [PathaoProviderAdapter],
  exports: [PathaoProviderAdapter]
})
export class PathaoProviderModule {}
