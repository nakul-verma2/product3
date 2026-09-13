// Demo mode: in-memory sample data so every page can be explored
// with no backend running. Active when localStorage token === DEMO_TOKEN.
// Preview-only: method names and response shapes mirror the real backend
// (see plan.md), so all pages work unchanged against the live API later.

export const DEMO_TOKEN = "demo-preview";

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("token") === DEMO_TOKEN;
  } catch {
    return false;
  }
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// Deterministic pseudo-random so charts look stable across reloads.
function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const NOW = Date.now();
const MIN = 60000;

const store = {
  websites: [
    { _id: "w1", name: "Company store", url: "https://store.example.com", status: "up", avgResponseMs: 212, uptimePercent: 99.98, lastCheckedAt: new Date(NOW - 1 * MIN).toISOString() },
    { _id: "w2", name: "Marketing blog", url: "https://blog.example.com", status: "up", avgResponseMs: 168, uptimePercent: 99.95, lastCheckedAt: new Date(NOW - 1 * MIN).toISOString() },
    { _id: "w3", name: "Payments API", url: "https://api.example.com/payments", status: "down", avgResponseMs: null, uptimePercent: 94.2, lastCheckedAt: new Date(NOW - 2 * MIN).toISOString() },
    { _id: "w4", name: "Docs", url: "https://docs.example.com", status: "paused", avgResponseMs: 190, uptimePercent: 99.9, lastCheckedAt: new Date(NOW - 60 * MIN).toISOString() },
    { _id: "w5", name: "Status API", url: "https://status-api.example.com", status: "up", avgResponseMs: 96, uptimePercent: 100, lastCheckedAt: new Date(NOW - 1 * MIN).toISOString() },
  ],
  apps: [
    { _id: "a1", name: "Tally Prime", url: "http://192.168.1.20:8080", type: "tally", status: "up" },
    { _id: "a2", name: "Warehouse CCTV", url: "192.168.1.44:554", type: "cctv", status: "up" },
    { _id: "a3", name: "Payment webhook", url: "https://hooks.example.com/pay", type: "payment_gateway", status: "paused" },
  ],
  audits: [
    { _id: "r1", period: "12months", uptimePercent: 99.1, incidents: 3, mttrMinutes: 9, createdAt: new Date(NOW - 30 * 24 * 60 * MIN).toISOString(), pdfUrl: null },
    { _id: "r2", period: "6months", uptimePercent: 99.4, incidents: 1, mttrMinutes: 6, createdAt: new Date(NOW - 60 * 24 * 60 * MIN).toISOString(), pdfUrl: null },
  ],
  alertSettings: {
    emailEnabled: true,
    whatsappEnabled: true,
    smsEnabled: false,
    callEnabled: false,
    language: "en",
    phones: ["+15551234567"],
    cooldownMinutes: 15,
    onlyOnStatusChange: true,
  },
};

/** Synthesized check history: 15-min steps, deterministic per site. */
function genLogs(id, days = 7) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 7);
  const r = rand(seed);
  const site = store.websites.find((w) => w._id === id);
  const base = site?.avgResponseMs || 200;
  const steps = Math.min(Math.max(days * 96, 24), 3000);
  const out = [];
  for (let i = steps; i >= 0; i--) {
    const t = NOW - i * 15 * MIN;
    const down = site?.status === "down" && i < 8;
    const wave = Math.sin(i / 12) * 30 + r() * 60;
    out.push({
      checkedAt: new Date(t).toISOString(),
      responseTimeMs: down ? null : Math.max(40, Math.round(base + wave)),
      statusCode: down ? 500 : 200,
      isUp: !down,
    });
  }
  return out;
}

function segmentsFor(site, count = 30) {
  const logs = genLogs(site._id, 1).slice(-count);
  return logs.map((l) => (l.isUp ? "up" : "down"));
}

export const demoApi = {
  login: async (email) => {
    await delay();
    return { token: DEMO_TOKEN, user: { id: "demo-user", email: email || "demo@example.com" } };
  },
  register: async (email) => {
    await delay();
    return { token: DEMO_TOKEN, user: { id: "demo-user", email: email || "demo@example.com" } };
  },

  listWebsites: async () => {
    await delay();
    return [...store.websites];
  },
  getWebsite: async (id) => {
    await delay(250);
    return store.websites.find((w) => w._id === id) || store.websites[0];
  },
  getLogs: async (id, { days = 7, limit = 200 } = {}) => {
    await delay(400);
    return genLogs(id, days).slice(-limit);
  },
  addWebsite: async (name, url) => {
    await delay();
    const site = { _id: `w${NOW}`, name, url, status: "up", avgResponseMs: 180, uptimePercent: 100, lastCheckedAt: new Date().toISOString() };
    store.websites.unshift(site);
    return site;
  },
  deleteWebsite: async (id) => {
    await delay();
    store.websites = store.websites.filter((w) => w._id !== id);
    return { ok: true };
  },
  togglePause: async (id, isPaused) => {
    await delay();
    const site = store.websites.find((w) => w._id === id);
    if (site) site.status = isPaused ? "paused" : "up";
    return site || { ok: true };
  },

  getSummary: async () => {
    await delay(250);
    const up = store.websites.filter((w) => w.status === "up").length;
    const down = store.websites.filter((w) => w.status === "down").length;
    return { total: store.websites.length, up, down, businessApps: store.apps.length, recentIncidents: 1 };
  },

  listBusinessApps: async () => {
    await delay();
    return [...store.apps];
  },
  addBusinessApp: async ({ name, url, type }) => {
    await delay();
    const app = { _id: `a${NOW}`, name, url, type, status: "up" };
    store.apps.unshift(app);
    return app;
  },
  deleteBusinessApp: async (id) => {
    await delay();
    store.apps = store.apps.filter((a) => a._id !== id);
    return { ok: true };
  },

  generateAudit: async (period = "12months") => {
    await delay(1200);
    const report = { _id: `r${NOW}`, period, uptimePercent: 99.1, incidents: 3, mttrMinutes: 9, createdAt: new Date().toISOString(), pdfUrl: null };
    store.audits.unshift(report);
    return { report };
  },
  listAudits: async () => {
    await delay();
    return [...store.audits];
  },

  getAlertSettings: async () => {
    await delay();
    return { ...store.alertSettings };
  },
  updateAlertSettings: async (payload) => {
    await delay();
    store.alertSettings = { ...store.alertSettings, ...payload };
    return { ok: true, settings: { ...store.alertSettings } };
  },
  testAlert: async () => {
    await delay(600);
    return { ok: true };
  },

  getPublicStatus: async (userId) => {
    await delay();
    const services = store.websites.map((s) => ({
      _id: s._id,
      name: s.name,
      url: s.url,
      status: s.status,
      uptimePercent: s.uptimePercent,
      avgResponseMs: s.avgResponseMs,
      segments: segmentsFor(s),
    }));
    const down = services.filter((s) => s.status === "down").length;
    return { userId, overall: down > 0 ? "degraded" : "operational", services };
  },
  getIncidents: async (websiteId) => {
    await delay(250);
    if (websiteId === "w3" || !websiteId) {
      return [
        { _id: "i1", websiteId: "w3", status: "ongoing", startedAt: new Date(NOW - 118 * MIN).toISOString(), rootCause: "Server Error", durationMinutes: null },
        { _id: "i2", websiteId: "w3", status: "resolved", startedAt: new Date(NOW - 26 * 60 * MIN).toISOString(), endedAt: new Date(NOW - 26 * 60 * MIN + 14 * MIN).toISOString(), rootCause: "Timeout", durationMinutes: 14 },
      ].filter((i) => !websiteId || i.websiteId === websiteId);
    }
    return [];
  },
};
