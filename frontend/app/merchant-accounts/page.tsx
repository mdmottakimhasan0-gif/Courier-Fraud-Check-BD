"use client";

import { Truck } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Merchant Accounts" description="Courier merchant credential status, provider health, and verification state." icon={Truck} />
    </AppShell>
  );
}
