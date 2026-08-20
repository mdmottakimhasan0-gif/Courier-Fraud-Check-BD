import { CourierShipmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { CourierStatusNormalizer } from "./status/courier-status.normalizer";

describe("CourierStatusNormalizer", () => {
  const normalizer = new CourierStatusNormalizer();

  it("normalizes successful courier statuses", () => {
    expect(normalizer.normalize("delivered")).toBe(CourierShipmentStatus.DELIVERED);
    expect(normalizer.normalize("paid")).toBe(CourierShipmentStatus.DELIVERED);
  });

  it("normalizes return and cancellation statuses", () => {
    expect(normalizer.normalize("cancelled")).toBe(CourierShipmentStatus.CANCELLED);
    expect(normalizer.normalize("agent-returning")).toBe(CourierShipmentStatus.RETURNED);
  });

  it("keeps unrecognized statuses isolated as unknown", () => {
    expect(normalizer.normalize("provider-specific-future-status")).toBe(CourierShipmentStatus.UNKNOWN);
  });
});
