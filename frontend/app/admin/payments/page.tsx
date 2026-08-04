"use client";

import { CreditCard } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Payments" description="Transactions, verification, retry, cancellation, provider references, and webhook status." icon={CreditCard} /></AppShell>;
}
