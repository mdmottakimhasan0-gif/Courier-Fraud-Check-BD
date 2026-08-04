"use client";

import { SlidersHorizontal } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Queues" description="BullMQ queue latency, worker state, retries, failures, and DLQ status." icon={SlidersHorizontal} /></AppShell>;
}
