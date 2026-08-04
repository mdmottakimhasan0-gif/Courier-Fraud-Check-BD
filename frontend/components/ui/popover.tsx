import { ReactNode } from "react";
import { Card } from "./card";

export function PopoverPreview({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {trigger}
      <Card className="absolute right-0 top-11 z-20 hidden w-72 p-3 group-hover:block">{children}</Card>
    </span>
  );
}
