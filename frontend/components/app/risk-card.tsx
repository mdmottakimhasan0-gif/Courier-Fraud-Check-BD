import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { asRecord, numberFrom, textFrom } from "../../lib/live-data";

export function RiskCard({ result }: { result?: unknown }) {
  const data = asRecord(result);
  const score = Math.min(100, Math.max(0, numberFrom(data.riskScore ?? data.score)));
  const confidence = Math.min(100, Math.max(0, numberFrom(data.confidenceScore ?? data.confidence)));
  const badge = textFrom(data.riskBadge ?? data.badge, score >= 70 ? "High" : score >= 40 ? "Medium" : "Low");
  const explanation = textFrom(
    data.riskExplanation ?? data.explanation,
    "No live risk result is loaded yet. Run a fraud search or select a history item to view the explanation."
  );
  const aggregate = asRecord(data.aggregate ?? data.summary);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Risk Intelligence</CardTitle>
        <Badge tone={badge === "High" ? "red" : badge === "Medium" ? "amber" : "green"}>{badge}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-semibold">{score}</span>
            <span className="text-sm text-muted-foreground">{confidence}% confidence</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${score}%` }} />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{explanation}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Deliveries" value={String(numberFrom(aggregate.totalDeliveries ?? data.totalDeliveries))} />
          <Metric label="Cancelled" value={String(numberFrom(aggregate.cancelledDeliveries ?? data.cancelledDeliveries))} />
          <Metric label="Success Rate" value={`${numberFrom(aggregate.successRate ?? data.successRate)}%`} />
          <Metric label="Freshness" value={textFrom(data.dataFreshness ?? data.freshness, "Live API")} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
