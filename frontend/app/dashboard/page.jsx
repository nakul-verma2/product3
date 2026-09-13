"use client";

import { Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Copy, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, SkeletonCards, SkeletonRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import {
  asArray,
  copyToClipboard,
  cx,
  formatMs,
  formatPct,
  normalizeWebsite,
  truncateUrl,
} from "@/lib/format";

function useDashboardData() {
  const fetchAll = useCallback(async () => {
    const [summary, websites, apps] = await Promise.all([
      api.getSummary().catch(() => null),
      api.listWebsites().catch(() => []),
      api.listBusinessApps().catch(() => []),
    ]);
    return { summary, websites: asArray(websites).map(normalizeWebsite), apps: asArray(apps) };
  }, []);

  const { data, loading, error, retry, execute } = useApi(fetchAll);
  usePolling(() => execute().catch(() => {}), 60000);
  return { data, loading, error, retry };
}

function CopyUrl({ url }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      title={url}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (await copyToClipboard(url)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } else toast("Could not copy URL.", "error");
      }}
      className="group inline-flex max-w-[260px] items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
    >
      <span className="truncate tabular-nums">{truncateUrl(url)}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
      )}
    </button>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").toLowerCase();
  const { data, loading, error, retry } = useDashboardData();

  const websites = useMemo(() => {
    const list = data?.websites || [];
    if (!q) return list;
    return list.filter(
      (w) => w.name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q)
    );
  }, [data, q]);

  const summary = data?.summary || {};
  const total = summary.total ?? websites.length;
  const up = summary.up ?? websites.filter((w) => w.status === "up").length;
  const down = summary.down ?? websites.filter((w) => w.status === "down").length;
  const appsCount = summary.businessApps ?? summary.totalBusinessApps ?? data?.apps?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-zinc-500">Live status of everything you watch.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/add-website")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Add website
        </motion.button>
      </div>

      {loading && !data ? (
        <>
          <SkeletonCards />
          <SkeletonRows rows={6} />
        </>
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={retry} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total monitored" value={total} sub={`${websites.length} websites`} />
            <StatCard label="Up now" value={up} tone="green" sub="Responding normally" />
            <StatCard label="Down" value={down} tone={down > 0 ? "red" : "zinc"} sub={down > 0 ? "Needs attention" : "All quiet"} />
            <StatCard label="Business apps" value={appsCount} sub="Across all types" />
          </div>

          {websites.length === 0 ? (
            <EmptyState
              icon={<Globe className="h-8 w-8" />}
              title={q ? "No websites match your search" : "No websites yet"}
              hint={q ? "Try a different search term." : "Add your first website and checks start within a minute."}
              action={
                !q ? (
                  <Link
                    href="/add-website"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4" /> Add website
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Response</th>
                      <th className="px-4 py-3 text-right font-medium">Uptime</th>
                      <th className="px-4 py-3 text-right font-medium">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((w, i) => (
                      <motion.tr
                        key={w.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.18 }}
                        onClick={() => w.id && router.push(`/website/${w.id}`)}
                        className={cx("border-t border-zinc-100 transition hover:bg-zinc-50", w.id && "cursor-pointer")}
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">{w.name}</td>
                        <td className="px-4 py-3"><CopyUrl url={w.url} /></td>
                        <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{formatMs(w.responseMs)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{formatPct(w.uptime)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-zinc-900 underline-offset-2 hover:underline">Open</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={<><SkeletonCards /><SkeletonRows rows={6} /></>}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}
