"use client";

import { Command, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";

export function CommandPalettePreview() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Jump to action" />
        </div>
        {["New fraud search", "Open billing", "Review audit logs"].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Command className="h-4 w-4 text-primary" />
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
