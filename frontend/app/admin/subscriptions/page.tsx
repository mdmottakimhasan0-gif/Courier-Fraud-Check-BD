"use client";

import { WalletCards } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Subscriptions" description="Activation, renewal, upgrade, downgrade, cancellation, resume, and lifecycle review." icon={WalletCards} /></AppShell>;
}
