import { Inject, Injectable } from "@nestjs/common";
import type { CourierProvider } from "../contracts/courier-provider.interface";
import type { CourierProviderId } from "../contracts/courier-provider.types";
import { COURIER_PROVIDER_COLLECTION } from "../provider.tokens";

@Injectable()
export class ProviderFactory {
  private readonly providersById: ReadonlyMap<CourierProviderId, CourierProvider>;

  constructor(@Inject(COURIER_PROVIDER_COLLECTION) providers: CourierProvider[]) {
    this.providersById = new Map(providers.map((provider) => [provider.id, provider]));
  }

  get(providerId: CourierProviderId): CourierProvider {
    const provider = this.providersById.get(providerId);
    if (!provider) {
      throw new Error(`Courier provider is not registered: ${providerId}`);
    }

    return provider;
  }

  list(): CourierProvider[] {
    return [...this.providersById.values()];
  }
}
