import { Injectable } from "@nestjs/common";
import type { CourierProviderId } from "../../courier-providers/contracts/courier-provider.types";

export type ProviderWeightMap = Readonly<Record<CourierProviderId, number>>;

export interface ProviderWeightStrategy {
  getWeights(): ProviderWeightMap;
}

@Injectable()
export class StaticProviderWeightStrategy implements ProviderWeightStrategy {
  private readonly weights: ProviderWeightMap = {
    pathao: 1,
    redx: 1,
    steadfast: 1
  };

  getWeights(): ProviderWeightMap {
    return this.weights;
  }
}
