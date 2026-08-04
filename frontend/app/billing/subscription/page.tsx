"use client";

import { WalletCards } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Subscription" description="Current subscription lifecycle, upgrade, downgrade, renew, cancel, and resume controls." icon={WalletCards} />
    </AppShell>
  );
}
