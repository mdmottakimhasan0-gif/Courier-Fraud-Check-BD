"use client";

import { Database } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Redis" description="Cache health, hit ratio, invalidation posture, locks, and search cache visibility." icon={Database} /></AppShell>;
}
