"use client";

import { ReceiptText } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Invoices" description="Invoice generation, statuses, idempotency review, and billing audit readiness." icon={ReceiptText} /></AppShell>;
}
