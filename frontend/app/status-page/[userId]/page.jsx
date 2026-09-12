"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, Check, Copy, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/Skeleton";
import { Toaster, toast } from "@/components/ui/Toaster";
import { UptimeBar } from "@/components/charts/UptimeBar";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import { asArray, copyToClipboard, cx, formatPct } from "@/lib/format";

function normalizeServices(payload) {
  if (!payload) return [];
  const lists = [
    payload.services,
    payload.websites,
    payload.sites,
    payload.targets,
    payload.businessApps,
  ];
  for (const l of lists) {
    if (Array.isArray(l) && l.length) return l;
  }
  const arr = asArray(payload);
  return arr;
}

export default function PublicStatusPage() {
  const params = useParams();
  const userId = params.userId;
  const [copied, setCopied] = useState(false);

  // Public client: no token is ever attached (see lib/api.js).
  const fetchStatus = useCallback(() => api.getPublicStatus(userId), [userId]);
  const { data, loading, error, retry, execute } = useApi(fetchStatus);
  usePolling(() => execute().catch(() => {}), 60000);

  const services = useMemo(() => normalizeServices(data), [data]);
  const down = services.filter((s) => (s.status || "up").toLowerCase() === "down").length;
  const overall = data?.overall || (down > 0 ? "degraded" : "operational");

  const share = async () => {
    if (await copyToClipboard(window.location.href)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } else toast("Could not copy the link.", "error");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950">
            <Activity className="h-4 w-4 text-emerald-400" />
          </span>
          <p className="text-sm font-semibold">Pulseboard Status</p>
          <button
            onClick={() => execute().catch(() => {})}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            <RefreshCw className={cx("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-6 py-8">
        {error && !data ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : (
          <>
            <div
              className={cx(
                "rounded-xl border px-5 py-4",
                down > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
              )}
            >
              <p className={cx("text-sm font-semibold", down > 0 ? "text-amber-800" : "text-emerald-800")}>
                {loading && !data
                  ? "Checking systems…"
                  : down > 0
                    ? `Partial outage — ${down} of ${services.length} systems down`
                    : `All systems operational${overall === "degraded" ? " (degraded)" : ""}`}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-zinc-500">Auto-refreshes every 60 seconds.</p>
            </div>

            {loading && !data ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="h-4 w-40 rounded bg-zinc-200" />
                    <div className="mt-4 h-7 rounded bg-zinc-100" />
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
                No public services to show yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {services.map((s, i) => {
                  const status = (s.status || "up").toLowerCase();
                  const segs = Array.isArray(s.segments)
                    ? s.segments
                    : Array(30).fill(status === "down" ? "down" : "up");
                  return (
                    <div key={s._id || s.id || i} className="rounded-xl border border-zinc-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{s.name || s.url || "Service"}</p>
                        <StatusBadge status={status} />
                      </div>
                      <UptimeBar segments={segs} className="mt-3" />
                      <div className="mt-2 flex items-center justify-between text-xs tabular-nums text-zinc-500">
                        <span>{formatPct(s.uptimePercent ?? s.uptime)} · 90 days</span>
                        {s.avgResponseMs != null ? <span>{Math.round(s.avgResponseMs)} ms avg</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}
