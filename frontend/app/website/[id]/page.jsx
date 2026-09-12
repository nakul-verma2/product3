"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState, SkeletonRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { ResponseChart } from "@/components/charts/ResponseChart";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import {
  aggregateByHour,
  asArray,
  cx,
  downsamplePoints,
  formatCheckedAt,
  formatFullTime,
  formatMs,
  formatPct,
  normalizeLog,
  normalizeWebsite,
} from "@/lib/format";

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
];

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [range, setRange] = useState(RANGES[1]);
  const [mutating, setMutating] = useState("");

  const fetchAll = useCallback(async () => {
    const [site, logsRes, incidentsRes] = await Promise.all([
      api.getWebsite(id),
      api.getLogs(id, { days: range.days, limit: 200 }).catch(() => []),
      api.getIncidents(id).catch(() => []),
    ]);
    const siteObj = site?.website || site?.data || site;
    let logs = asArray(logsRes).map(normalizeLog).sort((a, b) => a.t - b.t);
    if (logs.length > 1000) logs = aggregateByHour(logs.map((l) => l.raw));
    return { site: normalizeWebsite(siteObj), logs, incidents: asArray(incidentsRes) };
  }, [id, range.days]);

  const { data, loading, error, retry, execute } = useApi(fetchAll);
  usePolling(() => execute().catch(() => {}), 60000);

  const series = useMemo(() => {
    const pts = (data?.logs || []).map((l) => ({ t: l.t, ms: l.ms }));
    return downsamplePoints(pts, 300);
  }, [data]);

  const recent = useMemo(() => (data?.logs || []).slice(-20).reverse(), [data]);

  const mutate = async (kind, fn, okMsg) => {
    setMutating(kind);
    try {
      await fn();
      toast(okMsg);
      if (kind === "delete") router.push("/dashboard");
      else execute().catch(() => {});
    } catch (err) {
      toast(err?.message || "Action failed.", "error");
    } finally {
      setMutating("");
    }
  };

  const paused = data?.site.status === "paused";

  return (
    <AppShell>
      <div className="space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {loading && !data ? (
          <SkeletonRows rows={8} />
        ) : error && !data ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : data ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">{data.site.name}</h1>
                <p className="truncate text-sm tabular-nums text-zinc-500">{data.site.url}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusBadge status={data.site.status} />
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!!mutating}
                  onClick={() =>
                    mutate(paused ? "resume" : "pause", () => api.togglePause(id, !paused), paused ? "Monitoring resumed." : "Monitoring paused.")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {mutating === "pause" || mutating === "resume" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : paused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  {paused ? "Resume" : "Pause"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!!mutating}
                  onClick={() => {
                    if (confirm("Delete this website and all its logs?")) {
                      mutate("delete", () => api.deleteWebsite(id), "Website deleted.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  {mutating === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Uptime · {range.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{formatPct(data.site.uptime)}</p>
              </Card>
              <Card className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Avg response</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMs(data.site.responseMs)}</p>
              </Card>
              <Card className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Checks loaded</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{data.logs.length}</p>
              </Card>
            </div>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Response time</h2>
                <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
                  {RANGES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setRange(r)}
                      className={cx(
                        "rounded-md px-3 py-1 text-xs font-medium tabular-nums transition",
                        range.label === r.label ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponseChart key={range.label} data={series} />
            </Card>

            <Card className="overflow-hidden">
              <h2 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold">Recent checks</h2>
              {recent.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-zinc-500">
                  No checks yet — the first one lands within a minute of adding.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-5 py-2.5 font-medium">Time</th>
                        <th className="px-5 py-2.5 font-medium">Result</th>
                        <th className="px-5 py-2.5 text-right font-medium">Code</th>
                        <th className="px-5 py-2.5 text-right font-medium">Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((l, i) => (
                        <tr key={i} className="border-t border-zinc-100">
                          <td className="px-5 py-2.5 tabular-nums text-zinc-600" title={formatFullTime(l.t)}>
                            {formatCheckedAt(l.t)}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", l.up ? "text-emerald-700" : "text-rose-700")}>
                              <span className={cx("h-1.5 w-1.5 rounded-full", l.up ? "bg-emerald-500" : "bg-rose-500")} />
                              {l.up ? "Up" : "Down"}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right tabular-nums text-zinc-600">{l.code ?? "—"}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums text-zinc-600">{formatMs(l.ms)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold">Incidents</h2>
              {data.incidents.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">No incidents recorded for this site.</p>
              ) : (
                <ol className="mt-3 space-y-0 border-l border-zinc-200">
                  {data.incidents.slice(0, 10).map((inc, i) => (
                    <li key={inc._id || inc.id || i} className="relative pb-4 pl-5 last:pb-0">
                      <span className={cx("absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full", inc.status === "ongoing" ? "bg-rose-500" : "bg-zinc-300")} />
                      <p className="text-sm font-medium text-zinc-900">
                        {inc.status === "ongoing" ? "Ongoing outage" : "Resolved"}
                        {inc.durationMinutes != null ? <span className="font-normal tabular-nums text-zinc-500"> · {inc.durationMinutes} min</span> : null}
                      </p>
                      <p className="text-xs tabular-nums text-zinc-500">
                        {inc.startedAt ? formatFullTime(inc.startedAt) : ""}
                        {inc.rootCause ? ` · ${inc.rootCause}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
