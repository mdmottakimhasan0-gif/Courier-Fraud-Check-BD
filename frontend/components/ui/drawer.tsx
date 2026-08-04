import { ReactNode } from "react";
import { Card } from "./card";

export function DrawerPreview({ children }: { children: ReactNode }) {
  return <Card className="fixed inset-x-0 bottom-0 z-40 rounded-b-none border-b-0 p-4 shadow-soft md:left-auto md:w-96">{children}</Card>;
}
