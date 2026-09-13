import { cx } from "@/lib/format";

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-md bg-zinc-200/80", className)} />;
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-zinc-100 p-4 last:border-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="ml-auto h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-900">Couldn&apos;t load data</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
