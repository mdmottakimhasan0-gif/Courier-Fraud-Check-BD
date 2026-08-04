"use client";

import { Siren } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Maintenance" description="Read-only mode, admin/IP whitelist, request handling, and platform banner state." icon={Siren} /></AppShell>;
}
