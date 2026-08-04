import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="text-2xl font-semibold">Verification Successful</h1>
          <p className="text-sm text-muted-foreground">Your account is ready.</p>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
