import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-lg">
        <CardContent className="text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The requested production route does not exist or is protected by the portal.
          </p>
          <Link href="/" className="mt-6 inline-flex">
            <Button>Return Home</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
