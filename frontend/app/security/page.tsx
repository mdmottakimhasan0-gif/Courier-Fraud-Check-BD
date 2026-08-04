"use client";

import { ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Security" description="Password changes, MFA readiness, recovery codes, email change, and account protection." icon={ShieldCheck} />
    </AppShell>
  );
}
