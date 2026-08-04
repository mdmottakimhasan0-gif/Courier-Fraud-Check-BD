"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest, type ApiEnvelope } from "./api";

export type ApiRecord = Record<string, unknown>;
export type ChartPoint = { day: string; searches: number; risky: number };
export type DisplayRow = Record<string, string | number>;

export function useLiveApi<T>(key: readonly string[], path: string, enabled = true) {
  return useQuery<ApiEnvelope<T>>({
    queryKey: key,
    queryFn: () => apiRequest<T>(path),
    enabled
  });
}

export function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const record = asRecord(value);
  for (const key of ["items", "records", "data", "results", "history", "invoices", "plans", "sessions"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}

export function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function textFrom(value: unknown, fallback = "Not available"): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(numberFrom(value));
}

export function displayRows(value: unknown): DisplayRow[] {
  return asArray(value).map((item, index) => {
    const record = asRecord(item);
    const id = textFrom(record.id ?? record.invoiceId ?? record.searchId ?? record.keyId ?? index + 1, String(index + 1));
    const name = textFrom(
      record.name ?? record.title ?? record.email ?? record.phoneNumber ?? record.planName ?? record.provider ?? record.type,
      "Record"
    );
    const status = textFrom(record.status ?? record.state ?? record.accountStatus ?? record.paymentStatus, "Active");
    const metric = textFrom(
      record.metric ?? record.amount ?? record.usage ?? record.total ?? record.riskScore ?? record.successRate,
      "-"
    );
    return { id, name, status, metric };
  });
}

export function chartFromHistory(value: unknown): ChartPoint[] {
  const source = asArray(value);
  const buckets = new Map<string, ChartPoint>();
  for (const item of source) {
    const record = asRecord(item);
    const dateValue = textFrom(record.createdAt ?? record.date ?? record.finishedAt, "Unknown");
    const day = dateValue === "Unknown" ? "Unknown" : dateValue.slice(5, 10);
    const point = buckets.get(day) ?? { day, searches: 0, risky: 0 };
    point.searches += 1;
    const risk = textFrom(record.riskBadge ?? record.riskLevel ?? record.status, "").toLowerCase();
    if (risk.includes("high") || numberFrom(record.riskScore) >= 70) {
      point.risky += 1;
    }
    buckets.set(day, point);
  }
  return Array.from(buckets.values()).slice(-10);
}

export function endpointForModule(title: string, admin: boolean): string {
  const slug = title.toLowerCase();
  if (!admin) {
    if (slug.includes("search history") || slug.includes("saved") || slug.includes("favorite")) return "/fraud-search";
    if (slug.includes("profile")) return "/auth/profile";
    if (slug.includes("session") || slug.includes("security")) return "/auth/sessions";
    if (slug.includes("api key")) return "/admin/api-keys";
    if (slug.includes("merchant")) return "/admin/courier-credentials";
    if (slug.includes("notification")) return "/admin/announcements";
    return "/health";
  }
  if (slug === "users") return "/admin/users";
  if (slug === "roles") return "/admin/roles";
  if (slug === "permissions") return "/admin/permissions";
  if (slug.includes("merchant")) return "/admin/courier-credentials";
  if (slug.includes("courier")) return "/health";
  if (slug.includes("api key")) return "/admin/api-keys";
  if (slug === "plans") return "/admin/billing/plans";
  if (slug.includes("subscription")) return "/admin/billing/subscriptions";
  if (slug.includes("coupon")) return "/admin/billing/coupons";
  if (slug.includes("promo")) return "/admin/billing/promos";
  if (slug.includes("invoice")) return "/admin/billing/invoices";
  if (slug.includes("payment")) return "/admin/billing/transactions";
  if (slug.includes("analytics")) return "/admin/billing/analytics";
  if (slug.includes("search")) return "/admin/searches";
  if (slug.includes("audit")) return "/admin/audit-logs";
  if (slug.includes("announcement")) return "/admin/announcements";
  if (slug.includes("feature")) return "/admin/feature-flags";
  if (slug.includes("setting")) return "/admin/settings/general";
  if (slug.includes("maintenance")) return "/admin/settings/maintenance";
  if (slug.includes("redis")) return "/health/redis";
  if (slug.includes("queue")) return "/health/queues";
  if (slug.includes("monitoring") || slug.includes("health")) return "/health";
  return "/admin/dashboard";
}
