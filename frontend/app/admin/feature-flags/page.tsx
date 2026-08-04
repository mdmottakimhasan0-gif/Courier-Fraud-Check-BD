"use client";

import { Flag } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Feature Flags" description="Future feature toggles, scoped enablement, kill switches, and rollout controls." icon={Flag} /></AppShell>;
}
