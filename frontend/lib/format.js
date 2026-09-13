import { format, formatDistanceToNow } from "date-fns";
import clsx from "clsx";

export const cx = clsx;

export function asArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  for (const key of ["websites", "items", "logs", "reports", "incidents", "apps", "services"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

export function normalizeWebsite(w = {}) {
  return {
    id: w._id || w.id || "",
    name: w.name || w.url || "Untitled",
    url: w.url || "",
    status: (w.status || (w.isPaused ? "paused" : "up")).toLowerCase(),
    responseMs: w.avgResponseMs ?? w.responseTimeMs ?? w.lastResponseMs ?? null,
    uptime: w.uptimePercent ?? w.uptime ?? null,
    lastChecked: w.lastCheckedAt || w.lastChecked || w.updatedAt || null,
    raw: w,
  };
}

export function normalizeLog(l = {}) {
  const t = new Date(l.checkedAt || l.createdAt || l.time || Date.now()).getTime();
  return {
    t,
    ms: typeof l.responseTimeMs === "number" ? l.responseTimeMs : null,
    up: l.isUp ?? (typeof l.statusCode === "number" ? l.statusCode < 400 : true),
    code: l.statusCode ?? null,
    raw: l,
  };
}

/** Bucket-average time series down to max points (keeps chart morphs smooth). */
export function downsamplePoints(points, max = 300) {
  if (!Array.isArray(points) || points.length <= max || max < 1) return points || [];
  const bucketSize = Math.ceil(points.length / max);
  const out = [];
  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize);
    const msVals = bucket.map((p) => p.ms).filter((v) => typeof v === "number");
    out.push({
      t: bucket[Math.floor(bucket.length / 2)].t,
      ms: msVals.length ? Math.round(msVals.reduce((a, b) => a + b, 0) / msVals.length) : null,
    });
  }
  return out;
}

/** Aggregate raw logs to hourly buckets when the payload is huge (>1000). */
export function aggregateByHour(logs) {
  const buckets = new Map();
  for (const l of logs.map(normalizeLog)) {
    const hour = Math.floor(l.t / 3600000) * 3600000;
    if (!buckets.has(hour)) buckets.set(hour, { sum: 0, n: 0, up: 0, total: 0 });
    const b = buckets.get(hour);
    if (typeof l.ms === "number") {
      b.sum += l.ms;
      b.n += 1;
    }
    b.total += 1;
    if (l.up) b.up += 1;
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, b]) => ({ t, ms: b.n ? Math.round(b.sum / b.n) : null }));
}

export function formatMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  return `${Math.round(ms)} ms`;
}

export function formatPct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Number(v).toFixed(digits)}%`;
}

export function formatCheckedAt(t) {
  try {
    return format(new Date(t), "MMM d, HH:mm");
  } catch {
    return "";
  }
}

export function formatFullTime(t) {
  try {
    return format(new Date(t), "MMM d, yyyy HH:mm:ss");
  } catch {
    return "";
  }
}

export function timeAgo(t) {
  try {
    return formatDistanceToNow(new Date(t), { addSuffix: true });
  } catch {
    return "";
  }
}

export function normalizeUrl(input) {
  let v = (input || "").trim();
  if (!v) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = `https://${v}`;
  return v;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/** Client validation for website URLs: https normalize, http(s) only, no loopback. */
export function validateWebsiteInput(name, url) {
  if (!name || !name.trim()) return { ok: false, error: "Name is required." };
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false, error: "URL is required." };
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: "That URL does not look valid." };
  }
  if (!/^https?:$/.test(parsed.protocol))
    return { ok: false, error: "Only http:// and https:// URLs are supported." };
  if (LOOPBACK.has(parsed.hostname.toLowerCase()))
    return { ok: false, error: "Localhost URLs cannot be monitored from the server." };
  return { ok: true, normalized };
}

export function truncateUrl(url, max = 42) {
  if (!url) return "";
  const short = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return short.length > max ? `${short.slice(0, max)}…` : short;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function isValidPhone(p) {
  return /^\+?[1-9]\d{7,14}$/.test(p.trim());
}
