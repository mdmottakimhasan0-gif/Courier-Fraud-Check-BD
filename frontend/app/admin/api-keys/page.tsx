"use client";

import { KeyRound } from "lucide-react";
import { AppShell } from "../../../components/app/app-shell";
import { ModulePage } from "../../../components/app/module-page";

export default function Page() {
  return <AppShell mode="admin"><ModulePage admin title="API Keys" description="Tenant developer keys, usage, scopes, rotation, revocation, and abuse review." icon={KeyRound} /></AppShell>;
}
