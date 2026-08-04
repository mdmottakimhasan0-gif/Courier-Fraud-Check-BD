"use client";

import { Search } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Saved Searches" description="Saved phone checks, notes, exports, and reusable customer lists." icon={Search} />
    </AppShell>
  );
}
