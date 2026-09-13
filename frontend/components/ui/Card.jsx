import { cx } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";

export function Card({ className, children }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "zinc" }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const tones = {
    zinc: "text-zinc-900",
    green: "text-emerald-600",
    red: "text-rose-600",
    amber: "text-amber-600",
  };
  return (
    <Card className="p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={cx("mt-2 text-3xl font-semibold tabular-nums", tones[tone])}>
        {typeof value === "number" ? animated : value}
      </p>
      {sub ? <p className="mt-1 text-sm text-zinc-500">{sub}</p> : null}
    </Card>
  );
}
