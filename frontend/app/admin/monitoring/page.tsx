"use client";

import { Activity } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Monitoring" description="Structured logging, request latency, infrastructure metrics, and future error tracking." icon={Activity} /></AppShell>;
}
