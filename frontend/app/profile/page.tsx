"use client";

import { UserCog } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Profile" description="Business identity, contact details, and secure account preferences." icon={UserCog} />
    </AppShell>
  );
}
