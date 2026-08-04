"use client";

import { ServerCog } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Health" description="Application, database, Redis, and queue health checks from backend health APIs." icon={ServerCog} /></AppShell>;
}
