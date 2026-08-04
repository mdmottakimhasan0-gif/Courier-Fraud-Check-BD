import { MoreHorizontal } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

export function DropdownPreview({ items }: { items: string[] }) {
  return (
    <div className="relative inline-block">
      <Button variant="secondary" size="icon" aria-label="Open menu">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      <Card className="absolute right-0 top-12 z-10 hidden w-44 p-2 group-focus-within:block">
        {items.map((item) => (
          <button key={item} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted" type="button">
            {item}
          </button>
        ))}
      </Card>
    </div>
  );
}
