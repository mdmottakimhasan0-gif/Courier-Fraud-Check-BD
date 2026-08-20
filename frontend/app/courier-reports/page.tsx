"use client";

import { BarChart3 } from "lucide-react";
import { AppShell } from "../../components/app/app-shell";
import { ModulePage } from "../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage
        title="Courier Reports"
        description="Merchant-private parcel status, COD, cancellation, return, and provider performance reporting."
        icon={BarChart3}
      />
    </AppShell>
  );
}
