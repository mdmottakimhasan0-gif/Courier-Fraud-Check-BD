"use client";

import { Search } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Search Logs" description="Search records, partial failures, cache status, provider timing, and correlation IDs." icon={Search} /></AppShell>;
}
