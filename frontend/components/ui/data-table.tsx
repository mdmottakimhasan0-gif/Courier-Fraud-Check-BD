"use client";

import { Download, MoreHorizontal, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";

export type TableRow = Record<string, string | number>;

export function DataTable({ rows, columns }: { rows: TableRow[]; columns: string[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(query.toLowerCase()))
      ),
    [query, rows]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search records"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="secondary" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            Columns
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="border-t bg-card">
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={columns.length + 1}>
                    No live records returned by the API.
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={String(row.id)} className="border-t bg-card">
                  {columns.map((column) => {
                    const key = column.toLowerCase();
                    const value = row[key] ?? row[column] ?? "";
                    return (
                      <td key={`${row.id}-${column}`} className="px-4 py-3">
                        {key === "status" ? (
                          <Badge tone={value === "Active" ? "green" : value === "Locked" ? "red" : "amber"}>
                            {value}
                          </Badge>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>{filtered.length} records</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Previous
            </Button>
            <Button variant="secondary" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
