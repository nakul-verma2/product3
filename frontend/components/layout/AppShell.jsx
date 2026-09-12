"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "@/components/ui/PageTransition";
import { Toaster } from "@/components/ui/Toaster";
import { SkeletonCards, SkeletonRows } from "@/components/ui/Skeleton";

/** Auth guard + persistent shell (sidebar/topbar) for protected pages. */
export function AppShell({ children }) {
  const router = useRouter();
  // Read the token once during init; the effect below only redirects (no setState).
  const [hasToken] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("token")
  );

  useEffect(() => {
    if (!hasToken) router.replace("/login");
  }, [hasToken, router]);

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-7xl space-y-4 p-6">
          <SkeletonCards />
          <SkeletonRows rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main className="mx-auto max-w-7xl p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
