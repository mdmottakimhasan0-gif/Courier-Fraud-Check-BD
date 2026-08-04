"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard, Search, ShieldCheck } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { SearchTrendChart, RiskMixChart } from "../charts/overview-chart";
import { ProviderStatusCard } from "./provider-card";
import { RiskCard } from "./risk-card";
import { StatCard } from "./stat-card";
import { maskPhone } from "../../lib/utils";
import {
  asArray,
  asRecord,
  chartFromHistory,
  displayRows,
  numberFrom,
  textFrom,
  useLiveApi
} from "../../lib/live-data";

export function DashboardPage() {
  const history = useLiveApi<unknown>(["dashboard", "history"], "/fraud-search");
  const usage = useLiveApi<unknown>(["dashboard", "usage"], "/billing/usage");
  const subscription = useLiveApi<unknown>(["dashboard", "subscription"], "/billing/subscriptions/active");
  const health = useLiveApi<unknown>(["dashboard", "health"], "/health");
  const historyRows = asArray(history.data?.data);
  const usageData = asRecord(usage.data?.data);
  const subscriptionData = asRecord(subscription.data?.data);
  const healthData = asRecord(health.data?.data);
  const chartData = chartFromHistory(history.data?.data);
  const totalSearches = numberFrom(usageData.totalSearches ?? usageData.used ?? historyRows.length);
  const quota = numberFrom(usageData.monthlyLimit ?? usageData.quota ?? usageData.limit);
  const remaining = Math.max(0, quota - totalSearches);
  const highRisk = historyRows.filter((item) => {
    const record = asRecord(item);
    return (
      textFrom(record.riskBadge ?? record.riskLevel, "").toLowerCase().includes("high") ||
      numberFrom(record.riskScore) >= 70
    );
  }).length;
  const recentRows = historyRows.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="blue">Production portal</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Merchant Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Search performance, plan usage, courier health, and risk intelligence in one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/search">
            <Button>
              <Search className="h-4 w-4" />
              New Search
            </Button>
          </Link>
          <Link href="/billing">
            <Button variant="secondary">
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Searches Used" value={String(totalSearches)} trend="Loaded from billing usage API" icon={Search} />
        <StatCard
          label="Plan Quota"
          value={quota ? String(quota) : "Unlimited"}
          trend={textFrom(subscriptionData.planName ?? subscriptionData.name, "Current plan")}
          icon={ShieldCheck}
        />
        <StatCard
          label="Remaining"
          value={quota ? String(remaining) : "Unlimited"}
          trend="Calculated from live usage"
          icon={CreditCard}
        />
        <StatCard label="High Risk" value={String(highRisk)} trend="Calculated from live history" icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Search Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchTrendChart data={chartData} />
          </CardContent>
        </Card>
        <RiskCard result={historyRows[0]} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <ProviderStatusCard providers={healthData.providers ?? healthData.couriers} />
        <Card>
          <CardHeader>
            <CardTitle>Risk Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskMixChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRows.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No search history has been returned by the API yet.
              </div>
            )}
            {recentRows.map((item, index) => {
              const row = asRecord(item);
              const phone = textFrom(row.phoneNumber ?? row.phone, "01XXXXXXXXX");
              const risk = textFrom(row.riskBadge ?? row.riskLevel, "Unknown");
              return (
                <div key={`${phone}-${index}`} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{maskPhone(phone)}</p>
                    <p className="text-xs text-muted-foreground">
                      {textFrom(row.createdAt ?? row.finishedAt, "Pending timestamp")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={risk === "High" ? "red" : risk === "Medium" ? "amber" : "green"}>{risk}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{numberFrom(row.successRate)}% success</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscription Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable rows={displayRows(subscription.data?.data)} columns={["Id", "Name", "Status", "Metric"]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
