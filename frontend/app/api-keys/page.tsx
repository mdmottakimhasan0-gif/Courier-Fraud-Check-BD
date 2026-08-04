"use client";

import { KeyRound } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="API Keys" description="Developer keys, scopes, rotation, revocation, and usage summary." icon={KeyRound} />
    </AppShell>
  );
}
