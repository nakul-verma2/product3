"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cx } from "@/lib/format";

let pushToast = () => {};

export function toast(message, tone = "success") {
  pushToast({ id: Date.now() + Math.random(), message, tone });
}

/** Minimal custom toaster (no lib): listens on window events. */
export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    pushToast = (t) => {
      setItems((prev) => [...prev.slice(-2), t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3600);
    };
    const handler = (e) => pushToast({ id: Date.now() + Math.random(), message: e.detail?.message || "Done", tone: e.detail?.tone || "success" });
    window.addEventListener("app:toast", handler);
    return () => {
      pushToast = () => {};
      window.removeEventListener("app:toast", handler);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            "pointer-events-auto flex items-start gap-2 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg",
            t.tone === "error" ? "border-rose-200 text-zinc-900" : "border-zinc-200 text-zinc-900"
          )}
        >
          {t.tone === "error" ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
