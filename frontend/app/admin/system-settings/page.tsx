"use client";

import { Settings } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="System Settings" description="Platform configuration, security defaults, rate limits, and operational policy." icon={Settings} /></AppShell>;
}
