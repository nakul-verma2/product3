"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCheckedAt } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ms = payload[0]?.value;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-zinc-900">{ms == null ? "No data" : `${Math.round(ms)} ms`}</p>
      <p className="text-zinc-500">{formatCheckedAt(label)}</p>
    </div>
  );
}

/** Response-time line: crosshair tooltip, 500ms morph, stable key in parent. */
export function ResponseChart({ data = [], height = 260 }) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500"
        style={{ height }}
      >
        No checks recorded yet for this range.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => formatCheckedAt(t)}
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            minTickGap={48}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "4 4" }} />
          <Line
            type="monotone"
            dataKey="ms"
            stroke="#09090b"
            strokeWidth={1.75}
            dot={false}
            connectNulls
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
