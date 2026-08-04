"use client";

import { ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

export function Tabs({
  tabs,
  className
}: {
  tabs: Array<{ label: string; content: ReactNode }>;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted",
              active === index && "bg-primary text-primary-foreground hover:bg-primary"
            )}
            onClick={() => setActive(index)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[active]?.content}</div>
    </div>
  );
}
