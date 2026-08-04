import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export function StatCard({
  label,
  value,
  trend,
  icon: Icon
}: {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-emerald-600">{trend}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
