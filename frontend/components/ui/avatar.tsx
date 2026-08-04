import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Avatar({ className, initials = "CF", ...props }: HTMLAttributes<HTMLDivElement> & { initials?: string }) {
  return (
    <div
      className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground", className)}
      {...props}
    >
      {initials}
    </div>
  );
}
