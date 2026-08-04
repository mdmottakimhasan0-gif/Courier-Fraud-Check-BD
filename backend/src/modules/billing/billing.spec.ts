import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { InvoiceNumberGenerator } from "./invoices/invoice-number.generator";
import { StaticPaymentProvider } from "./providers/static-payment.provider";
import { UsageCounterService } from "./usage/usage-counter.service";

describe("Billing validation", () => {
  it("generates deterministic invoice prefixes without leaking tenant internals", () => {
    const invoiceNumber = new InvoiceNumberGenerator().generate(
      "tenant-abcdef123456",
      new Date("2026-08-04T06:00:00.000Z")
    );

    expect(invoiceNumber).toMatch(/^INV-20260804-TENANT-A-[A-Z0-9]{6}$/);
  });

  it("validates static payment provider contracts for create, verify, cancel, and webhooks", async () => {
    const provider = new StaticPaymentProvider(PaymentProvider.BKASH);

    await expect(
      provider.createPayment({
        amount: 1000,
        correlationId: "corr-1",
        currency: "BDT",
        idempotencyKey: "idem-1",
        paymentId: "pay-1"
      })
    ).resolves.toMatchObject({
      provider: PaymentProvider.BKASH,
      providerReference: "BKASH-pay-1",
      status: PaymentStatus.PROCESSING
    });
    await expect(provider.verify("pay-1")).resolves.toMatchObject({ status: PaymentStatus.PROCESSING });
    await expect(provider.cancel("pay-1")).resolves.toMatchObject({ status: PaymentStatus.CANCELLED });
    await expect(provider.verifyWebhookSignature()).resolves.toBe(false);
  });

  it("reads usage snapshot counters from repository-backed persistence", async () => {
    const prisma = {
      apiKey: { count: async () => 2 },
      auditLog: { count: async () => 4 },
      authSession: { count: async () => 3 },
      searchHistory: {
        count: async ({ where }: { where: { createdAt?: unknown } }) => (where.createdAt ? 7 : 11)
      }
    };
    const counter = new UsageCounterService(prisma as never);

    await expect(counter.snapshot("tenant-1", "user-1")).resolves.toMatchObject({
      activeSessions: 3,
      apiCalls: 0,
      apiKeys: 2,
      dailySearches: 7,
      loginCount: 4,
      monthlySearches: 7,
      savedSearches: 11
    });
  });
});
