import { cx } from "@/lib/format";

const MAP = {
  up: { dot: "bg-emerald-500", text: "Operational", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", pulse: false },
  down: { dot: "bg-rose-500", text: "Down", pill: "bg-rose-50 text-rose-700 ring-rose-200", pulse: true },
  paused: { dot: "bg-amber-500", text: "Paused", pill: "bg-amber-50 text-amber-700 ring-amber-200", pulse: false },
  degraded: { dot: "bg-amber-500", text: "Degraded", pill: "bg-amber-50 text-amber-700 ring-amber-200", pulse: false },
};

/** Status language: dot (+ slowed ping only when down) + text. */
export function StatusBadge({ status = "up", className }) {
  const key = (status || "up").toLowerCase();
  const s = MAP[key] || MAP.up;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {s.pulse ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 [animation-duration:2s]" />
        ) : null}
        <span className={cx("relative inline-flex h-2 w-2 rounded-full", s.dot)} />
      </span>
      {s.text}
    </span>
  );
}
