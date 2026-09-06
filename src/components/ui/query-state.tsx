import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this",
  message = "Something went wrong on our side. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertCircle className="size-4" aria-hidden /> {title}
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

/** Renders the right state for a React Query result in one place. */
export function QueryState({
  query,
  rows,
  empty,
  children,
}: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown; data?: unknown };
  rows?: number;
  empty?: { title: string; message: string; action?: ReactNode } | null;
  children: ReactNode;
}) {
  if (query.isPending) return <LoadingRows rows={rows ?? 3} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (empty && Array.isArray(query.data) && query.data.length === 0) return <EmptyState {...empty} />;
  return <>{children}</>;
}
