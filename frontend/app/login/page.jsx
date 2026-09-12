"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { DEMO_TOKEN } from "@/lib/demo";
import { toast, Toaster } from "@/components/ui/Toaster";
import { UptimeBar } from "@/components/charts/UptimeBar";
import { cx } from "@/lib/format";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.login(email.trim(), password);
      const token = res.token || res.accessToken;
      if (!token) throw { message: "Login succeeded but no token was returned." };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.user || { email: email.trim() }));
      toast("Welcome back.");
      router.push("/dashboard");
    } catch (err) {
      if (err?.status === 401) setError("Invalid email or password.");
      else if (err?.status === 429) setError(err.message || "Too many attempts. Please wait and retry.");
      else setError(err?.message || "Could not sign in. Check the backend is running.");
    } finally {
      setBusy(false);
    }
  };

  // No backend needed: browse every page with sample data.
  const enterDemo = () => {
    localStorage.setItem("token", DEMO_TOKEN);
    localStorage.setItem("user", JSON.stringify({ id: "demo-user", email: "demo@example.com" }));
    toast("Demo mode — sample data, no backend needed.");
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="hidden w-[44%] flex-col justify-between bg-zinc-950 p-10 text-zinc-300 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Activity className="h-4 w-4 text-zinc-950" />
          </span>
          <p className="text-sm font-semibold text-white">Pulseboard</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Live overview
          </p>
          <h1 className="mt-2 max-w-sm text-3xl font-semibold leading-tight text-white">
            Every site you run, watched every minute.
          </h1>
          <div className="mt-8 max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-200">store.example.com</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>
            <UptimeBar
              className="mt-3 [&_span]:h-5"
              segments={["up","up","up","up","down","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up","up"]}
            />
            <div className="mt-3 flex gap-6 text-xs tabular-nums text-zinc-400">
              <span><span className="font-semibold text-zinc-100">99.98%</span> · 90d</span>
              <span><span className="font-semibold text-zinc-100">212ms</span> avg</span>
              <span><span className="font-semibold text-zinc-100">1</span> incident</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600">Minute checks · Instant alerts · ISO audit reports</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
          <p className="mt-1 text-sm text-zinc-500">Access your monitoring workspace.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ops@company.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              {busy ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>

          <button
            onClick={enterDemo}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98]"
          >
            Explore demo — no sign-in needed
          </button>
          <p className="mt-4 text-xs text-zinc-500">
            Backend must be running at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}.
          </p>
        </motion.div>
      </div>
      <Toaster />
    </div>
  );
}
