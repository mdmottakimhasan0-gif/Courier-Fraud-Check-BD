"use client";

import { Gauge } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Usage" description="Plan limits, hourly usage, daily usage, monthly quota, and cost visibility." icon={Gauge} />
    </AppShell>
  );
}
