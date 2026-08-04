"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Download, FileJson, Printer, Search, Star } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fraudApi } from "../../lib/api";
import { asArray, asRecord, numberFrom, textFrom } from "../../lib/live-data";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ProviderStatusCard } from "./provider-card";
import { RiskCard } from "./risk-card";

const searchSchema = z.object({
  phoneNumber: z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number")
});

type SearchValues = z.infer<typeof searchSchema>;

export function FraudSearchPage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { phoneNumber: "" }
  });
  const resultData = asRecord(result);
  const aggregate = asRecord(resultData.aggregate ?? resultData.summary);
  const providerRows = asArray(resultData.providers ?? resultData.providerResults);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Fraud Search</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cached results target under 300ms; fresh courier checks complete as providers respond.
        </p>
      </div>
      <Card className="glass">
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row"
            onSubmit={handleSubmit(async (values) => {
              setError(null);
              try {
                const response = await fraudApi.search(values.phoneNumber);
                setResult(response.data);
              } catch (searchError) {
                setError(searchError instanceof Error ? searchError.message : "Search request failed");
              }
            })}
          >
            <div className="flex-1">
              <Input placeholder="01XXXXXXXXX" {...register("phoneNumber")} />
              {errors.phoneNumber && <p className="mt-1 text-xs text-danger">{errors.phoneNumber.message}</p>}
            </div>
            <Button disabled={isSubmitting}>
              <Search className="h-4 w-4" />
              {isSubmitting ? "Searching" : "Search"}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {result ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Aggregate Result</CardTitle>
                <Badge tone="green">{textFrom(resultData.status, "Completed")}</Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Total Deliveries" value={String(numberFrom(aggregate.totalDeliveries ?? resultData.totalDeliveries))} />
                  <Metric label="Successful" value={String(numberFrom(aggregate.successfulDeliveries ?? resultData.successfulDeliveries))} />
                  <Metric label="Cancelled" value={String(numberFrom(aggregate.cancelledDeliveries ?? resultData.cancelledDeliveries))} />
                  <Metric label="Duration" value={textFrom(resultData.durationMs ?? resultData.duration, "-")} />
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {providerRows.map((providerItem, index) => {
                    const provider = asRecord(providerItem);
                    const name = textFrom(provider.name ?? provider.provider, `Provider ${index + 1}`);
                    const status = textFrom(provider.status, "Unknown");
                    return (
                      <div key={name} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{name}</p>
                          <Badge tone={status === "Completed" || status === "Operational" ? "green" : "amber"}>
                            {status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {numberFrom(provider.latencyMs ?? provider.latency)}ms provider latency
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    <Star className="h-4 w-4" />
                    Favorite
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button variant="secondary" size="sm">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {["Queued", "Searching", "Partial", "Completed"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <RiskCard result={result} />
            <ProviderStatusCard providers={providerRows} />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Enter a Bangladeshi phone number to request a live fraud search from the backend search API.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
