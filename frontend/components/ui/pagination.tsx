import { Button } from "./button";

export function Pagination({ page = 1, total = 8 }: { page?: number; total?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Page {page} of {total}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">Previous</Button>
        <Button variant="secondary" size="sm">Next</Button>
      </div>
    </div>
  );
}
