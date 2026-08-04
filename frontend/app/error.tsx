"use client";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md">
        <CardContent className="space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">The request could not be completed.</p>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
