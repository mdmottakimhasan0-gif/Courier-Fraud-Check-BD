"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  Truck,
  Zap
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

const couriers = ["Steadfast", "Pathao", "RedX"];
const features = [
  { title: "Parallel courier checks", icon: Zap, text: "Provider searches run independently with timeout, retry, and partial-failure protection." },
  { title: "Secure merchant vault", icon: LockKeyhole, text: "Merchant credentials are encrypted at rest and never exposed in plain text." },
  { title: "Commercial SaaS controls", icon: KeyRound, text: "Plans, API keys, RBAC, audit trails, and future marketplace readiness are built in." },
  { title: "Low-latency intelligence", icon: Clock3, text: "Cached searches target sub-300ms response while fresh courier calls remain graceful." }
];
const faqs = [
  ["Does it copy any GPL courier package code?", "No. Courier integrations are independently implemented against observable API behavior and your merchant credentials."],
  ["Can developers use the API?", "Yes. API key architecture and OpenAPI documentation are prepared for public REST API expansion."],
  ["What happens if one courier fails?", "The search engine returns partial results and keeps the full search from failing."]
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-semibold">Courier Fraud Check BD</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            {["Features", "Couriers", "Pricing", "FAQ", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-foreground">
                {item}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link href="/register">
              <Button>
                Start
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge tone="green">Production SaaS v1.0</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">
              Courier Fraud Check BD
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Enterprise-ready fraud intelligence for Bangladeshi merchants, combining secure courier lookups,
              risk scoring, billing controls, admin operations, and developer-ready APIs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/search">
                <Button className="w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  Search a Phone
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full sm:w-auto">
                  View Portal
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl border bg-card p-4 shadow-2xl shadow-blue-950/10"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-semibold">Live Risk Workspace</p>
                  <p className="text-xs text-muted-foreground">API v1, RBAC, audit ready</p>
                </div>
                <Badge tone="blue">Cached & fresh</Badge>
              </div>
              <div className="grid gap-3 py-4 sm:grid-cols-3">
                {["Total 0", "Success 0%", "Risk 0"].map((item) => (
                  <div key={item} className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{item.split(" ")[0]}</p>
                    <p className="mt-2 text-2xl font-semibold">{item.split(" ")[1]}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {couriers.map((courier, index) => (
                  <div key={courier} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                        <Truck className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{courier}</span>
                    </div>
                    <Badge tone={index === 2 ? "amber" : "green"}>{index === 2 ? "Graceful" : "Ready"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section id="features" title="Built for serious merchant operations" eyebrow="Platform">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-6 w-6 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{feature.text}</CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="couriers" title="Supported courier integrations" eyebrow="Bangladesh">
        <div className="grid gap-4 md:grid-cols-3">
          {couriers.map((courier) => (
            <Card key={courier}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{courier}</span>
                </div>
                <Badge tone="green">Adapter ready</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="pricing" title="Commercial pricing controls" eyebrow="Plans">
        <div className="grid gap-4 md:grid-cols-3">
          {["Starter", "Growth", "Enterprise"].map((plan) => (
            <Card key={plan} className={plan === "Growth" ? "border-blue-300 ring-2 ring-blue-500/15" : undefined}>
              <CardHeader>
                <CardTitle>{plan}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Live plan data is managed from the billing API and admin console.</p>
                <p className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Usage limits, invoices, coupons
                </p>
                <Link href="/billing">
                  <Button variant={plan === "Growth" ? "primary" : "secondary"} className="w-full">
                    Review Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="faq" title="Frequently asked questions" eyebrow="Trust">
        <div className="grid gap-4 md:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <Card key={question}>
              <CardHeader>
                <CardTitle>{question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{answer}</CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="contact" title="Launch-ready support" eyebrow="Contact">
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Ready for merchant onboarding</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Configure environment variables, connect merchant credentials securely, and deploy with the production
                runbooks generated in this release.
              </p>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row">
              <Input type="email" placeholder="merchant@example.com" aria-label="Newsletter email" />
              <Button type="button">
                <Mail className="h-4 w-4" />
                Notify Me
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>Courier Fraud Check BD v1.0</p>
          <div className="flex gap-4">
            <Link href="/dashboard">Portal</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/login">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Section({
  id,
  title,
  eyebrow,
  children
}: {
  id: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <Badge tone="blue">{eyebrow}</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
