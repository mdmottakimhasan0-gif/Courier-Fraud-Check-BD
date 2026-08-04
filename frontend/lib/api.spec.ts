import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, authApi, billingApi, fraudApi } from "./api";

describe("Frontend API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends standardized request headers and parses response envelopes", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({
          correlationId: "corr-1",
          data: { ok: true },
          message: "ok",
          success: true,
          timestamp: "2026-08-04T06:00:00.000Z"
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    await expect(apiRequest("/health", { apiKey: "dev-key", token: "jwt-token" })).resolves.toMatchObject({
      data: { ok: true },
      success: true
    });

    const firstCall = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const [, init] = firstCall;
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(headers.get("x-api-key")).toBe("dev-key");
    expect(headers.get("x-correlation-id")).toBeTruthy();
    expect(init.credentials).toBe("include");
  });

  it("maps auth, fraud, and billing API contracts to backend v1 paths", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({
          correlationId: "corr-1",
          data: {},
          message: "ok",
          success: true,
          timestamp: "2026-08-04T06:00:00.000Z"
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    await authApi.login({ email: "merchant@example.com", password: "password" });
    await fraudApi.search("01712345678");
    await billingApi.plans();

    const calledUrls = (fetchSpy.mock.calls as unknown as Array<[string, RequestInit]>).map(([url]) => String(url));
    expect(calledUrls).toEqual([
      "http://localhost:4000/api/v1/auth/login",
      "http://localhost:4000/api/v1/fraud-search",
      "http://localhost:4000/api/v1/billing/plans"
    ]);
  });

  it("throws standardized errors from failed API envelopes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            correlationId: "corr-1",
            data: null,
            message: "Unauthorized",
            success: false,
            timestamp: "2026-08-04T06:00:00.000Z"
          }),
          { status: 401 }
        )
      )
    );

    await expect(apiRequest("/auth/profile")).rejects.toThrow("Unauthorized");
  });
});
