import type {
  CourierCheckRequest,
  CourierProviderId,
  CourierProviderResult
} from "./courier-provider.types";

export interface CourierProvider {
  readonly id: CourierProviderId;
  check(request: CourierCheckRequest): Promise<CourierProviderResult>;
}
