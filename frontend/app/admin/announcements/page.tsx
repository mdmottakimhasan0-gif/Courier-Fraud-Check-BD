"use client";

import { Bell } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Announcements" description="User notices, publish state, scheduling, and maintenance communication." icon={Bell} /></AppShell>;
}
