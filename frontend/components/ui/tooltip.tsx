import { ReactNode } from "react";

export function TooltipText({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-xs text-white group-hover:block">
        {label}
      </span>
    </span>
  );
}
