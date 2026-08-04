"use client";

import { Users } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Users" description="User lifecycle, lockout, suspension, activation, role assignment, and forced logout." icon={Users} /></AppShell>;
}
