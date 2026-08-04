"use client";

import { ShieldCheck } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Permissions" description="PBAC permissions, categories, guard mapping, and secure action visibility." icon={ShieldCheck} /></AppShell>;
}
