"use client";

import { Truck } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Courier Providers" description="Provider status, circuit breaker visibility, retry posture, latency, and degradation monitoring." icon={Truck} /></AppShell>;
}
