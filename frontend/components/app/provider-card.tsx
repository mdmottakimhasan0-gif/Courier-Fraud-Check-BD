import { Activity } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { asArray, asRecord, numberFrom, textFrom } from "../../lib/live-data";

export function ProviderStatusCard({ providers }: { providers?: unknown }) {
  const rows = asArray(providers);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Provider health will appear after live courier credentials and searches are available.
          </div>
        )}
        {rows.map((item, index) => {
          const provider = asRecord(item);
          const name = textFrom(provider.name ?? provider.provider, `Provider ${index + 1}`);
          const status = textFrom(provider.status ?? provider.health, "Unknown");
          return (
          <div key={name} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{numberFrom(provider.latencyMs ?? provider.latency)}ms latency</p>
              </div>
            </div>
            <Badge tone={status === "Operational" || status === "Healthy" ? "green" : "amber"}>{status}</Badge>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
