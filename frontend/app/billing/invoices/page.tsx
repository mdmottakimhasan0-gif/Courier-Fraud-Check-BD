"use client";

import { ReceiptText } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Invoices" description="Invoice list, payment status, receipts, and export actions." icon={ReceiptText} />
    </AppShell>
  );
}
