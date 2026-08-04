"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, createContext, useContext, useMemo, useState } from "react";

type Locale = "en" | "bn";

type AppContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 45_000,
            refetchOnWindowFocus: false,
            retry: 1
          },
          mutations: {
            retry: 0
          }
        }
      }),
    []
  );
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      theme,
      toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light"))
    }),
    [locale, theme]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={value}>
        <div className={theme === "dark" ? "dark min-h-screen" : "min-h-screen"}>{children}</div>
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within Providers");
  }
  return context;
}
