"use client";

import { Activity } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Sessions" description="Current device, active sessions, revocation, and logout-all controls." icon={Activity} />
    </AppShell>
  );
}
