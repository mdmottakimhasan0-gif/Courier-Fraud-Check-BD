"use client";

import { LucideIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Tabs } from "../ui/tabs";
import { displayRows, endpointForModule, useLiveApi } from "../../lib/live-data";

export function ModulePage({
  title,
  description,
  icon: Icon,
  admin = false
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  admin?: boolean;
}) {
  const endpoint = endpointForModule(title, admin);
  const live = useLiveApi<unknown>(["module", title, endpoint], endpoint);
  const rows = displayRows(live.data?.data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone={admin ? "amber" : "blue"}>{admin ? "Admin" : "Portal"}</Badge>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-normal">
            <Icon className="h-7 w-7 text-primary" />
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={live.isFetching}>Live API</Button>
          <Button variant="secondary">Export</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Records" value={String(rows.length)} />
        <SummaryCard label="Status" value={live.isError ? "Error" : live.isLoading ? "Loading" : "Live"} />
        <SummaryCard label="Endpoint" value={endpoint} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title} Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          {live.error && <p className="mb-4 text-sm text-danger">{live.error.message}</p>}
          <Tabs
            tabs={[
              {
                label: "Overview",
                content: <DataTable rows={rows} columns={["Id", "Name", "Status", "Metric"]} />
              },
              {
                label: "Activity",
                content: <ActivityFeed title={title} endpoint={endpoint} />
              },
              {
                label: "Settings",
                content: <SettingsPanel />
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ title, endpoint }: { title: string; endpoint: string }) {
  return (
    <div className="space-y-3">
      {["API response rendered", "RBAC/PBAC protected", "Audit trail compatible"].map((item) => (
        <div key={item} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{item}</p>
          <p className="text-muted-foreground">
            {title} uses {endpoint} with standardized API envelopes.
          </p>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {["Feature flag ready", "Permission guarded", "Audit logged", "API contract aligned"].map((item) => (
        <div key={item} className="rounded-md border p-3 text-sm">
          {item}
        </div>
      ))}
    </div>
  );
}
