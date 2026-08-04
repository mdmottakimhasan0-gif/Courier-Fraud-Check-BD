import { AppShell } from "../../components/app/app-shell";
import { DashboardPage } from "../../components/app/dashboard-page";

export default function Page() {
  return (
    <AppShell mode="admin">
      <DashboardPage />
    </AppShell>
  );
}
