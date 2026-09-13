"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "@/components/ui/PageTransition";
import { Toaster } from "@/components/ui/Toaster";
import { SkeletonCards, SkeletonRows } from "@/components/ui/Skeleton";

const emptySubscribe = () => () => {};

function useHasToken() {
  return useSyncExternalStore(
    emptySubscribe,
    () => !!localStorage.getItem("token"),
    () => false
  );
}

export function AppShell({ children }) {
  const router = useRouter();
  const hasToken = useHasToken();

  if (!hasToken) {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        if (!localStorage.getItem("token")) {
          router.replace("/login");
        }
      });
    }

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