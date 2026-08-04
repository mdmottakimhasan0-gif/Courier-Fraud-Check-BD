import { describe, expect, it } from "vitest";
import { API_VERSION, PRODUCT_NAME, createApiEnvelope } from "./index";

describe("shared package contract", () => {
  it("exports stable product metadata and response envelope helper", () => {
    expect(PRODUCT_NAME).toBe("Courier Fraud Check BD");
    expect(API_VERSION).toBe("v1");
    expect(createApiEnvelope({ ok: true }, "corr-1")).toEqual({
      data: { ok: true },
      meta: { correlationId: "corr-1", version: "v1" }
    });
  });
});
