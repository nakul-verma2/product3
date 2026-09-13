"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const env = process.env.NEXT_PUBLIC_ENV || "local";

  const submit = (e) => {
    e.preventDefault();
    router.push(q.trim() ? `/dashboard?q=${encodeURIComponent(q.trim())}` : "/dashboard");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
        <form onSubmit={submit} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search websites…"
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600 ring-1 ring-inset ring-zinc-200">
            {env}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
