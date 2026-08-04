"use client";

import { Landmark } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Merchant Credentials" description="Encrypted courier credential management, health checks, enablement, disablement, and testing." icon={Landmark} /></AppShell>;
}
