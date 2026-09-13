"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, SkeletonRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api, resolvePdfUrl } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { asArray, cx, formatFullTime, formatPct } from "@/lib/format";

const PERIODS = [
  { value: "1month", label: "Last month", months: 1 },
  { value: "3months", label: "Last 3 months", months: 3 },
  { value: "6months", label: "Last 6 months", months: 6 },
  { value: "12months", label: "Last 12 months", months: 12 },
];

export default function AuditPage() {
  const [period, setPeriod] = useState(PERIODS[3]);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const fetchAudits = async () => asArray(await api.listAudits());
  const { data: audits, loading, error, retry } = useApi(fetchAudits);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateAudit(period.value);
      const next = res.report || res;
      setReport(next);
      toast("Audit report generated.");
    } catch (err) {
      toast(err?.message || "Report generation failed.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const pdfUrl = report ? resolvePdfUrl(report.pdfUrl || report.url) : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Audit reports</h1>
          <p className="text-sm text-zinc-500">ISO-style uptime evidence, generated from check history.</p>
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p)}
                  className={cx(
                    "rounded-md px-3 py-1.5 text-xs font-medium tabular-nums transition",
                    period.value === p.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {p.months}M
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={generate}
              disabled={generating}
              className={cx(
                "inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800",
                generating && "opacity-70"
              )}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {generating ? `Generating ${period.label}…` : `Generate ISO audit report [${period.months}M v]`}
            </motion.button>
          </div>
          {generating ? (
            <p className="mt-3 text-xs tabular-nums text-zinc-500">
              Aggregating up to 12 months of checks — this can take up to a minute.
            </p>
          ) : null}

          {report && report.uptimePercent != null ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Uptime</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{formatPct(report.uptimePercent)}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Incidents</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{report.incidents ?? report.incidentCount ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">MTTR</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {report.mttrMinutes != null || report.mttr != null ? `${report.mttrMinutes ?? report.mttr} min` : "—"}
                </p>
              </div>
            </div>
          ) : null}

          {pdfUrl ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <ExternalLink className="h-4 w-4" /> Open in new tab
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
              <iframe title="Audit report preview" src={pdfUrl} className="h-[480px] w-full rounded-lg border border-zinc-200 bg-zinc-50" />
            </div>
          ) : null}
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Past reports</h2>
          {loading && !audits ? (
            <SkeletonRows rows={4} />
          ) : error && !audits ? (
            <ErrorState message={error.message} onRetry={retry} />
          ) : !audits?.length ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No reports yet"
              hint="Generate your first audit report above."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Period</th>
                      <th className="px-4 py-3 text-right font-medium">Uptime</th>
                      <th className="px-4 py-3 text-right font-medium">Incidents</th>
                      <th className="px-4 py-3 text-right font-medium">MTTR</th>
                      <th className="px-4 py-3 text-right font-medium">Created</th>
                      <th className="px-4 py-3 text-right font-medium">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((r, i) => {
                      const url = resolvePdfUrl(r.pdfUrl || r.url);
                      return (
                        <tr key={r._id || r.id || i} className="border-t border-zinc-100 transition hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{r.period || r.periodLabel || "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{formatPct(r.uptimePercent ?? r.uptime)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{r.incidents ?? r.incidentCount ?? "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                            {r.mttrMinutes != null || r.mttr != null ? `${r.mttrMinutes ?? r.mttr} min` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                            {r.createdAt ? formatFullTime(r.createdAt) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-900 underline-offset-2 hover:underline">
                                <Download className="h-3.5 w-3.5" /> PDF
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
