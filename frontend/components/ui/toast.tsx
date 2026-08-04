import { CheckCircle2 } from "lucide-react";
import { Card } from "./card";

export function ToastPreview({ message }: { message: string }) {
  return (
    <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100">
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </Card>
  );
}
