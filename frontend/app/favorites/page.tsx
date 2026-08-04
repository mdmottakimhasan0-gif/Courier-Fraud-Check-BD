"use client";

import { Heart } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Favorites" description="Pinned searches, important customers, and high-priority fraud signals." icon={Heart} />
    </AppShell>
  );
}
