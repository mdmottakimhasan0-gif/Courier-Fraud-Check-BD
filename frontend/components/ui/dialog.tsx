import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export function DialogPreview({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
