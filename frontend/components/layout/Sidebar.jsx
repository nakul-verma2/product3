"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Activity,
  Bell,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Plus,
} from "lucide-react";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add-website", label: "Add Website", icon: Plus },
  {
    href: "/business-apps",
    label: "Business Apps",
    icon: MonitorSmartphone,
  },
  { href: "/audit", label: "Audit", icon: FileText },
  { href: "/alerts/settings", label: "Alerts", icon: Bell },
];

const emptySubscribe = () => () => {};

function getUserSnapshot() {
  try {
    return localStorage.getItem("user") || null;
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

function useStoredUser() {
  const userJson = useSyncExternalStore(
    emptySubscribe,
    getUserSnapshot,
    getServerSnapshot
  );

  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStoredUser();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

const statusUserId = user?.id || user?._id || user?.userId;

const statusHref = statusUserId
  ? `/status-page/${statusUserId}`
  : "/dashboard";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-zinc-950 text-zinc-300 md:flex">
      <div className="flex items-center gap-2 px-5 pb-5 pt-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Activity className="h-4 w-4 text-zinc-950" />
        </span>

        <div>
          <p className="text-sm font-semibold text-white">
            Pulseboard
          </p>
          <p className="text-[11px] text-zinc-500">
            Uptime monitoring
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Link
          href={statusHref}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
        >
          <Globe className="h-4 w-4" />
          Status Page
        </Link>
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
            {(user?.email?.[0] || "O").toUpperCase()}
          </span>

          <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
            {user?.email || "Operator"}
          </p>

          <button
            onClick={logout}
            title="Log out"
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}