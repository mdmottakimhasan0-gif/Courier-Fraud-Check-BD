"use client";

import { Boxes } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Plans" description="Subscription plan catalog, quotas, billing intervals, feature limits, and defaults." icon={Boxes} /></AppShell>;
}
