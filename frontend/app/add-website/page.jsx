"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import { cx, validateWebsiteInput } from "@/lib/format";

export default function AddWebsitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const check = validateWebsiteInput(name, url);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setBusy(true);
    try {
      await api.addWebsite(name.trim(), check.normalized);
      toast("Website added. First check runs within a minute.");
      router.push("/dashboard");
    } catch (err) {
      if (err?.status === 409) setError("This URL is already monitored in your workspace.");
      else setError(err?.message || "Could not add the website.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-lg font-semibold">Add website</h1>
          <p className="text-sm text-zinc-500">Checks start automatically, every minute.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company store"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                inputMode="url"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Scheme is optional — <span className="tabular-nums">example.com</span> becomes{" "}
                <span className="tabular-nums">https://example.com</span>. Localhost is rejected.
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                {error}
              </p>
            ) : null}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              className={cx(
                "flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800",
                busy && "opacity-70"
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Adding…" : "Add website"}
            </motion.button>
          </form>
        </Card>

        <p className="text-xs text-zinc-500">
          Tip: after adding, open the site detail to watch the first check land, then share your
          public status page.
        </p>
      </div>
    </AppShell>
  );
}
