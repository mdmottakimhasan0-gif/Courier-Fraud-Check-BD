"use client";

import { ListChecks } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Search History" description="Saved search records, status, details, and exports." icon={ListChecks} />
    </AppShell>
  );
}
