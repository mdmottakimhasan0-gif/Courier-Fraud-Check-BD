"use client";

import { LockKeyhole } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Roles" description="RBAC role catalog, assignment flow, and permission version aware updates." icon={LockKeyhole} /></AppShell>;
}
