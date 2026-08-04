"use client";

import { ListChecks } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Audit Logs" description="Immutable security actions, impersonation events, admin mutations, and export review." icon={ListChecks} /></AppShell>;
}
