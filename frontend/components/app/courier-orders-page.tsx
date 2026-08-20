"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCcw, Save, Search, Send, Truck } from "lucide-react";
import { courierOrdersApi } from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type Provider = "STEADFAST" | "PATHAO" | "REDX";

type RiskData = {
  badge: string;
  explanation: string;
  merchantHistory: {
    cancelledOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    previousOrders: number;
    returnRate: number;
  };
  recommendation: "recommended" | "caution" | "high_risk";
  score: number;
};

type OrderData = {
  codAmount: number;
  createdAt: string;
  failureReason?: string;
  id: string;
  invoiceNumber: string;
  merchantOrderId: string;
  provider: Provider;
  risk: { badge: string; recommendation?: string; score?: number };
  shipments: Array<{ id: string; status: string; trackingId?: string; consignmentId?: string; rawStatus?: string }>;
  status: string;
};

type ReportData = {
  byProvider: Array<{ count: number; provider: Provider; status: string }>;
  codDeliveredAmount: number;
  summary: {
    cancelled: number;
    delivered: number;
    failed: number;
    pending: number;
    returnRate: number;
    returned: number;
    total: number;
  };
};

const providerOptions: Provider[] = ["STEADFAST", "PATHAO", "REDX"];

export function CourierOrdersPage() {
  const [provider, setProvider] = useState<Provider>("STEADFAST");
  const [phoneNumber, setPhoneNumber] = useState("");
  const orders = useQuery({ queryKey: ["courier-orders"], queryFn: () => courierOrdersApi.list() });
  const credentials = useQuery({ queryKey: ["courier-credentials"], queryFn: () => courierOrdersApi.credentials() });
  const reports = useQuery({ queryKey: ["courier-order-reports"], queryFn: () => courierOrdersApi.reports() });
  const riskCheck = useMutation({ mutationFn: (phone: string) => courierOrdersApi.riskCheck(phone) });
  const createOrder = useMutation({
    mutationFn: (body: unknown) => courierOrdersApi.createOrder(body),
    onSuccess: async () => {
      await Promise.all([orders.refetch(), reports.refetch()]);
    }
  });
  const credentialMutation = useMutation({
    mutationFn: (body: unknown) => courierOrdersApi.saveCredential(body),
    onSuccess: async () => credentials.refetch()
  });
  const refreshShipment = useMutation({
    mutationFn: (shipmentId: string) => courierOrdersApi.refreshShipment(shipmentId),
    onSuccess: async () => orders.refetch()
  });
  const risk = riskCheck.data?.data as RiskData | undefined;
  const orderItems = useMemo(() => ((orders.data?.data as OrderData[] | undefined) ?? []), [orders.data]);
  const reportData = reports.data?.data as ReportData | undefined;

  function submitRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phoneNumber.trim()) {
      riskCheck.mutate(phoneNumber.trim());
    }
  }

  function submitCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedProvider = String(form.get("provider")) as Provider;
    const credentialsBody: Record<string, string | number | boolean> = {
      baseUrl: String(form.get("baseUrl") ?? "")
    };
    for (const key of ["apiKey", "secretKey", "clientId", "clientSecret", "username", "password", "accessToken", "storeId", "pickupStoreId"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) {
        credentialsBody[key] = ["storeId", "pickupStoreId"].includes(key) ? Number(value) : value;
      }
    }
    credentialMutation.mutate({
      credentials: credentialsBody,
      label: String(form.get("label") ?? `${selectedProvider} Account`),
      provider: selectedProvider
    });
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedProvider = String(form.get("provider")) as Provider;
    createOrder.mutate({
      codAmount: Number(form.get("codAmount") ?? 0),
      customerAddress: String(form.get("customerAddress") ?? ""),
      customerName: String(form.get("customerName") ?? ""),
      customerPhone: String(form.get("customerPhone") ?? ""),
      deliveryInstruction: String(form.get("deliveryInstruction") ?? ""),
      invoiceNumber: String(form.get("invoiceNumber") ?? ""),
      itemDescription: String(form.get("itemDescription") ?? ""),
      itemQuantity: Number(form.get("itemQuantity") ?? 1),
      itemWeightKg: Number(form.get("itemWeightKg") ?? 0.5),
      merchantOrderId: String(form.get("merchantOrderId") ?? ""),
      provider: selectedProvider,
      providerOptions: {
        deliveryArea: String(form.get("deliveryArea") ?? ""),
        deliveryAreaId: Number(form.get("deliveryAreaId") ?? 0) || undefined,
        pickupStoreId: Number(form.get("pickupStoreId") ?? 0) || undefined,
        storeId: Number(form.get("storeId") ?? 0) || undefined
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="blue">Merchant workflow</Badge>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-normal">
            <Truck className="h-7 w-7 text-primary" />
            Courier Orders
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Create parcels, check risk before dispatch, sync status, and keep merchant-private order history.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-sm">
          <Metric label="Total" value={String(reportData?.summary.total ?? 0)} />
          <Metric label="Delivered" value={String(reportData?.summary.delivered ?? 0)} />
          <Metric label="Return %" value={`${reportData?.summary.returnRate ?? 0}%`} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>One-click Courier Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={submitOrder}>
              <SelectField label="Courier" name="provider" value={provider} onChange={(value) => setProvider(value as Provider)} options={providerOptions} />
              <InputField label="Customer Phone" name="customerPhone" value={phoneNumber} onChange={setPhoneNumber} placeholder="017XXXXXXXX" />
              <InputField label="Customer Name" name="customerName" placeholder="Customer name" />
              <InputField label="Invoice Number" name="invoiceNumber" placeholder="INV-10001" />
              <InputField label="Merchant Order ID" name="merchantOrderId" placeholder="ORD-10001" />
              <InputField label="COD Amount" name="codAmount" type="number" placeholder="1250" />
              <InputField label="Item Quantity" name="itemQuantity" type="number" defaultValue="1" />
              <InputField label="Weight KG" name="itemWeightKg" type="number" defaultValue="0.5" step="0.1" />
              <InputField label="Pathao Store ID" name="storeId" type="number" />
              <InputField label="RedX Pickup Store ID" name="pickupStoreId" type="number" />
              <InputField label="RedX Delivery Area" name="deliveryArea" />
              <InputField label="RedX Delivery Area ID" name="deliveryAreaId" type="number" />
              <TextAreaField label="Address" name="customerAddress" className="md:col-span-2" />
              <TextAreaField label="Item / Instruction" name="itemDescription" className="md:col-span-2" />
              <TextAreaField label="Delivery Instruction" name="deliveryInstruction" className="md:col-span-2" />
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="button" variant="secondary" disabled={riskCheck.isPending || !phoneNumber} onClick={() => riskCheck.mutate(phoneNumber)}>
                  <Search className="h-4 w-4" />
                  Check Risk
                </Button>
                <Button disabled={createOrder.isPending}>
                  <Send className="h-4 w-4" />
                  Submit Parcel
                </Button>
              </div>
              {createOrder.error && <p className="md:col-span-2 text-sm text-danger">{createOrder.error.message}</p>}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="mb-4 flex gap-2" onSubmit={submitRisk}>
                <Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="017XXXXXXXX" />
                <Button size="icon" disabled={riskCheck.isPending} aria-label="Check risk">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              {risk ? (
                <div className="space-y-3">
                  <Badge tone={risk.recommendation === "high_risk" ? "red" : risk.recommendation === "caution" ? "amber" : "green"}>
                    {risk.recommendation.replace("_", " ")}
                  </Badge>
                  <p className="text-3xl font-semibold">{risk.score}</p>
                  <p className="text-sm text-muted-foreground">{risk.explanation}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Metric label="Previous" value={String(risk.merchantHistory.previousOrders)} />
                    <Metric label="Delivered" value={String(risk.merchantHistory.deliveredOrders)} />
                    <Metric label="Cancelled" value={String(risk.merchantHistory.cancelledOrders)} />
                    <Metric label="Pending" value={String(risk.merchantHistory.pendingOrders)} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Enter a Bangladeshi phone number to load global fraud risk and your own customer history.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courier Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={submitCredential}>
                <SelectField label="Provider" name="provider" options={providerOptions} />
                <InputField label="Label" name="label" placeholder="Main account" />
                <InputField label="Base URL" name="baseUrl" placeholder="Optional sandbox/live URL" />
                <InputField label="API Key / Client ID" name="apiKey" placeholder="Steadfast API key" />
                <InputField label="Secret Key / Client Secret" name="secretKey" placeholder="Steadfast secret key" />
                <InputField label="Pathao Client ID" name="clientId" />
                <InputField label="Pathao Client Secret" name="clientSecret" />
                <InputField label="Pathao Username" name="username" />
                <InputField label="Pathao Password" name="password" type="password" />
                <InputField label="RedX Access Token" name="accessToken" type="password" />
                <InputField label="Store / Pickup ID" name="storeId" type="number" />
                <Button disabled={credentialMutation.isPending}>
                  <Save className="h-4 w-4" />
                  Save Encrypted
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Invoice</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>COD</th>
                  <th>Tracking</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((order) => {
                  const shipment = order.shipments[0];
                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{order.invoiceNumber}</td>
                      <td>{order.provider}</td>
                      <td><Badge tone={order.status === "FAILED" ? "red" : order.status === "DELIVERED" ? "green" : "amber"}>{order.status}</Badge></td>
                      <td>{order.risk.score ?? 0} / {order.risk.recommendation ?? "unknown"}</td>
                      <td>{order.codAmount}</td>
                      <td>{shipment?.trackingId ?? shipment?.consignmentId ?? "-"}</td>
                      <td>
                        {shipment ? (
                          <Button size="sm" variant="secondary" disabled={refreshShipment.isPending} onClick={() => refreshShipment.mutate(shipment.id)}>
                            <RefreshCcw className="h-4 w-4" />
                            Sync
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">{order.failureReason ?? "No shipment"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InputField({
  label,
  name,
  onChange,
  value,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & { label: string; name: string; onChange?: (value: string) => void }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} {...props} />
    </label>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  value
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: string[];
  value?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-500/20"
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ className, label, name }: { className?: string; label: string; name: string }) {
  return (
    <label className={`space-y-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-blue-500/20"
        name={name}
      />
    </label>
  );
}
