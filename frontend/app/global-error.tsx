"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global frontend error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center px-4">
          <div className="max-w-lg rounded-lg border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">
              The production error boundary caught this request. Try again or review application logs.
            </p>
            <Button className="mt-6" onClick={reset}>
              Retry
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
