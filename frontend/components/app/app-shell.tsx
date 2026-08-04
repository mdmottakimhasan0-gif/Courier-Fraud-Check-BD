"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Languages, Menu, Moon, Search, ShieldCheck, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { TooltipText } from "../ui/tooltip";
import { useAppPreferences } from "../../app/providers";
import { adminNav, portalNav } from "../../lib/navigation";
import { cn } from "../../lib/utils";

export function AppShell({ children, mode = "portal" }: { children: React.ReactNode; mode?: "portal" | "admin" }) {
  const pathname = usePathname();
  const nav = mode === "admin" ? adminNav : portalNav;
  const { locale, setLocale, theme, toggleTheme } = useAppPreferences();

  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/90 backdrop-blur xl:block">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Courier Fraud Check BD</p>
            <p className="text-xs text-muted-foreground">{mode === "admin" ? "Admin Console" : "Merchant Portal"}</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="ghost" size="icon" className="xl:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="max-w-xl pl-9" placeholder="Search phone, customer, invoice, log" />
            </div>
            <Badge tone="green" className="hidden sm:inline-flex">
              API v1 connected
            </Badge>
            <TooltipText label="Switch language">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocale(locale === "en" ? "bn" : "en")}
                aria-label="Switch language"
              >
                <Languages className="h-5 w-5" />
              </Button>
            </TooltipText>
            <TooltipText label="Toggle theme">
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </TooltipText>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
