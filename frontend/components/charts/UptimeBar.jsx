import { cx } from "@/lib/format";

/**
 * 30-segment status bar like real status pages.
 * segments: Array<"up" | "down" | "nodata">
 */
export function UptimeBar({ segments = [], className }) {
  const segs = segments.slice(-30);
  while (segs.length < 30) segs.unshift("nodata");
  return (
    <div className={cx("flex items-center gap-[3px]", className)} title="Last 30 checks">
      {segs.map((s, i) => (
        <span
          key={i}
          className={cx(
            "h-7 flex-1 rounded-[3px]",
            s === "up" && "bg-emerald-500",
            s === "down" && "bg-rose-500",
            s === "nodata" && "bg-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

/** Build segments from normalized logs (newest last). */
export function segmentsFromLogs(logs = [], count = 30) {
  const tail = logs.slice(-count);
  return tail.map((l) => (l.up ? "up" : "down"));
}
