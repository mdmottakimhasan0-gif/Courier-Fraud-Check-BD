import { Skeleton } from "../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </main>
  );
}
