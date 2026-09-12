"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cctv,
  CreditCard,
  Globe,
  Loader2,
  MonitorSmartphone,
  Server,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, SkeletonRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePolling } from "@/hooks/usePolling";
import { asArray, cx, normalizeUrl, truncateUrl } from "@/lib/format";

const TYPES = [
  { value: "website", label: "Website", icon: Globe },
  { value: "tally", label: "Tally", icon: Server },
  { value: "erp", label: "ERP", icon: MonitorSmartphone },
  { value: "cctv", label: "CCTV", icon: Cctv },
  { value: "payment_gateway", label: "Payment", icon: CreditCard },
];

function TypeIcon({ type }) {
  const t = TYPES.find((x) => x.value === (type || "").toLowerCase()) || TYPES[0];
  return <t.icon className="h-4 w-4 text-zinc-500" />;
}

export default function BusinessAppsPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("website");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");

  const fetchApps = async () => asArray(await api.listBusinessApps());
  const { data: apps, loading, error, retry, execute } = useApi(fetchApps);
  usePolling(() => execute().catch(() => {}), 60000);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast("Name and URL are required.", "error");
      return;
    }
    setBusy(true);
    try {
      await api.addBusinessApp({ name: name.trim(), url: normalizeUrl(url), type });
      toast("Business app added.");
      setName("");
      setUrl("");
      execute().catch(() => {});
    } catch (err) {
      toast(err?.message || "Could not add the app.", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this business app?")) return;
    setDeleting(id);
    try {
      await api.deleteBusinessApp(id);
      toast("Business app deleted.");
      execute().catch(() => {});
    } catch (err) {
      toast(err?.message || "Delete failed.", "error");
    } finally {
      setDeleting("");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Business Apps</h1>
          <p className="text-sm text-zinc-500">Websites, Tally, ERP, CCTV and payment endpoints.</p>
        </div>

        <Card className="p-5">
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="App name"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://app.example.com or 192.168.1.10:8080"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              className={cx(
                "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800",
                busy && "opacity-70"
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add
            </motion.button>
          </form>
          <p className="mt-2 text-xs text-zinc-500">
            CCTV and Tally endpoints are often IP:port with no HTTP — use TCP-style URLs like 192.168.1.20:8080.
          </p>
        </Card>

        {loading && !apps ? (
          <SkeletonRows rows={5} />
        ) : error && !apps ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : !apps?.length ? (
          <EmptyState
            icon={<MonitorSmartphone className="h-8 w-8" />}
            title="No business apps yet"
            hint="Add Tally, ERP, CCTV or payment endpoints to monitor them alongside websites."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">URL</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a, i) => {
                    const id = a._id || a.id || i;
                    return (
                      <tr key={id} className="border-t border-zinc-100 transition hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{a.name || "Untitled"}</td>
                        <td className="px-4 py-3 tabular-nums text-zinc-500">{truncateUrl(a.url || "")}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-zinc-600">
                            <TypeIcon type={a.type} />
                            <span className="capitalize">{(a.type || "website").replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={a.status || "up"} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => remove(a._id || a.id)}
                            disabled={deleting === (a._id || a.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            {deleting === (a._id || a.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Delete
                          </button>
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
    </AppShell>
  );
}
