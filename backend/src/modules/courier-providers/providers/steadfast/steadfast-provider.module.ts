import { Module } from "@nestjs/common";
import { SteadfastProviderAdapter } from "./steadfast.provider";

@Module({
  providers: [SteadfastProviderAdapter],
  exports: [SteadfastProviderAdapter]
})
export class SteadfastProviderModule {}
