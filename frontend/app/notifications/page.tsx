"use client";

import { Bell } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Notifications" description="Operational alerts, billing notices, search events, and announcement preferences." icon={Bell} />
    </AppShell>
  );
}
