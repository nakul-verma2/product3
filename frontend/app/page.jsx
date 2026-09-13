"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Root redirect: dashboard when logged in, login otherwise. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Loading Pulseboard…
      </div>
    </div>
  );
}
