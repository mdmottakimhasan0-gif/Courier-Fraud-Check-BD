"use client";

import { CreditCard, ReceiptText, TicketPercent } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { asArray, asRecord, displayRows, formatCurrency, numberFrom, textFrom, useLiveApi } from "../../lib/live-data";

export function BillingPage() {
  const plans = useLiveApi<unknown>(["billing", "plans"], "/billing/plans");
  const subscription = useLiveApi<unknown>(["billing", "subscription"], "/billing/subscriptions/active");
  const invoices = useLiveApi<unknown>(["billing", "invoices"], "/billing/invoices");
  const usage = useLiveApi<unknown>(["billing", "usage"], "/billing/usage");
  const activePlan = asRecord(subscription.data?.data);
  const planRows = asArray(plans.data?.data);
  const invoiceRows = displayRows(invoices.data?.data);
  const usageData = asRecord(usage.data?.data);

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="green">{textFrom(activePlan.planName ?? activePlan.name, "Plan loaded from API")}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Subscription, invoices, payments, coupons, and usage are wired to the backend billing API contracts.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {planRows.length === 0 && (
          <Card className="lg:col-span-3">
            <CardContent className="text-sm text-muted-foreground">No billing plans were returned by the API.</CardContent>
          </Card>
        )}
        {planRows.map((item, index) => {
          const plan = asRecord(item);
          const name = textFrom(plan.name ?? plan.planName, `Plan ${index + 1}`);
          const active = name === textFrom(activePlan.planName ?? activePlan.name, "");
          return (
            <Card key={name} className={active ? "border-blue-300 ring-2 ring-blue-500/15" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{name}</CardTitle>
                  {active && <Badge tone="blue">Current</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold">{formatCurrency(plan.price ?? plan.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {textFrom(plan.monthlySearchLimit ?? plan.quota, "Quota from billing API")}
                </p>
                <Button variant={active ? "secondary" : "primary"} className="w-full">
                  {active ? "Manage" : "Switch"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BillingMetric icon={CreditCard} label="Usage" value={String(numberFrom(usageData.used ?? usageData.totalSearches))} />
        <BillingMetric icon={ReceiptText} label="Invoices" value={String(invoiceRows.length)} />
        <BillingMetric icon={TicketPercent} label="Coupon Savings" value={formatCurrency(usageData.couponSavings)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable rows={invoiceRows} columns={["Id", "Name", "Status", "Metric"]} />
        </CardContent>
      </Card>
    </div>
  );
}

function BillingMetric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
