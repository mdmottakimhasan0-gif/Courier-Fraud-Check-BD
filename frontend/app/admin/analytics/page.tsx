"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Analytics" description="Search usage, billing growth, provider latency, risk mix, and system adoption." icon={ChartNoAxesCombined} /></AppShell>;
}
