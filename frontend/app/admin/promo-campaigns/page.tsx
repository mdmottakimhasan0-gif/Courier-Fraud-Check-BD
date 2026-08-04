"use client";

import { Megaphone } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="Promo Campaigns" description="Campaign scheduling, coupon linkage, audience targeting, and performance review." icon={Megaphone} /></AppShell>;
}
