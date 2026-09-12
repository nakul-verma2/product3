# PRODUCT 03 - Frontend Implementation Plan
### Website Care & Uptime Monitoring - Next.js App Router + Tailwind
**Scope: Frontend only. Connects 1:1 to backend `plan.md` connectors. Follows `info.pdf` Sec.5 briefly.**

Backend base: `http://localhost:5000/api` via `NEXT_PUBLIC_API_URL`. Auth: `Bearer JWT`.

---

### 0. Setup (from PDF + hardened)

```
npx create-next-app@latest frontend --tailwind --app --src-dir false
npm i axios recharts framer-motion lucide-react date-fns clsx
```

Files from PDF to keep:
`app/login/page.jsx, app/dashboard/page.jsx, app/add-website/page.jsx, app/website/[id]/page.jsx, app/business-apps/page.jsx, app/audit/page.jsx, app/status-page/[userId]/page.jsx, app/alerts/settings/page.jsx, lib/api.js`

Add professional scaffolding (no extra backend needed):
`app/layout.jsx, app/globals.css, app/page.jsx (redirect), components/layout/Sidebar.jsx + Topbar.jsx, components/ui/Card.jsx + StatusBadge.jsx + EmptyState.jsx + Skeleton.jsx + PageTransition.jsx, components/charts/ResponseChart.jsx + UptimeBar.jsx, hooks/useApi.js + usePolling.js, lib/format.js`

`.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### 1. API Connector Layer - `lib/api.js` (critical for easy backend plug-in)

Single axios instance, all pages use this, never hardcode URLs:

```js
baseURL = process.env.NEXT_PUBLIC_API_URL
request interceptor: token = localStorage.getItem('token') -> Authorization: Bearer
response interceptor: 401 -> localStorage.clear + redirect /login, 5xx/429 -> throw normalized {message}
export api = { login, register, listWebsites, getWebsite, getLogs, addWebsite, deleteWebsite, togglePause, getSummary, listBusinessApps, addBusinessApp, deleteBusinessApp, generateAudit, listAudits, getAlertSettings, updateAlertSettings, testAlert, getPublicStatus, getIncidents }
```

Each maps exactly to backend plan:
`POST /api/auth/login, GET /api/websites/list, GET /api/websites/:id/logs?days=&page=, POST /api/websites/add, GET /api/dashboard/summary, POST /api/monitor/business-app/add, GET /api/monitor/business-app/list, GET /api/audit/report/generate?period=, GET /api/audit/reports/list, GET+PUT /api/alerts/settings, POST /api/alerts/test, GET /api/status/:userId (no token)`

> Future error fixed: token expiry loop, CORS misconfig, public page sending Bearer, log payload too large -> request `limit=200` + downsample client-side.

### 2. Design System - Anti AI-Slop Rules

Goal: look like Vercel Status / Datadog / BetterUptime, not generic AI gradient landing.

1.  **Palette:** light theme `bg-zinc-50, white cards, border-zinc-200, text-zinc-900/500`. Dark sidebar `bg-zinc-950`. Single semantic accents only: `emerald-500 up, rose-500 down, amber-500 degraded/paused`. No purple-blue gradients, no glassmorphism, no emoji.
2.  **Type:** Inter / Geist, `tabular-nums` for ms/%, uppercase `text-[11px] tracking-wider` labels. Dense `text-sm` tables, not hero-size text.
3.  **Layout:** persistent left Sidebar (Dashboard, Websites, Business Apps, Audit, Alerts, Status Page link) + top Topbar (search, env badge, avatar). Content `max-w-7xl p-6` with 4 KPI cards on top. All data in bordered tables with sticky header, hover row.
4.  **Status language:** `StatusBadge` = dot + pulse if down + text `Operational / Down / Paused`. `UptimeBar` = 30-segment bar (green/red/gray for no-data) like real status pages. This sells professionalism instantly.
5.  **Icons:** `lucide-react` only (`Globe, Server, Bell, FileText, Activity`). No illustrations.

### 3. Motion - High-End, Subtle, Professional

Use `framer-motion` sparingly. No bouncy spring page dives.

1.  `PageTransition`: fade+`y:4px` 180ms on route change only.
2.  Dashboard cards: staggered `opacity 0->1` + count-up numbers (custom hook, 600ms easeOut). Live up-dot: CSS `animate-ping` slowed to 2s, only on Down.
3.  Charts: `recharts` `animationDuration=500`, skeleton shimmer while loading, crosshair tooltip. Poll every 60s -> smooth data morph, no full re-mount (use `key` stable).
4.  Forms/buttons: `whileTap scale .98`, loading spinner in button, optimistic toggle for pause/mute. Toast on success/fail (simple custom, no lib needed).
5.  Respect `prefers-reduced-motion`.

> What NOT to do: parallax hero, floating blobs, typewriter, infinite carousel - instant AI-slop signal for an ops tool.

### 4. Pages (PDF Sec.5 -> implementation)

**`login/page.jsx`:** split-screen: left brand panel (dark, logo, live mini-status mock), right form email/password -> `api.login` -> save token -> push `/dashboard`. Handle 401 invalid, 429 rate-limit with inline error, show password toggle. No register UI unless needed.

**`dashboard/page.jsx`:** fetch `getSummary + listWebsites + listBusinessApps` parallel with `usePolling(60s)`. KPI cards: Total / Up / Down / Business Apps. Main table: Name, URL (truncated, copy on click), StatusBadge, Response ms, Uptime% , View link -> `/website/[id]`. EmptyState if 0 -> CTA to add-website. Skeleton rows while loading.

**`add-website/page.jsx`:** form Name + URL with client validation (`https://` normalize, URL constructor, block localhost). POST -> on success toast + push dashboard. Show inline backend 409 duplicate message. Add "Test now" hint.

**`website/[id]/page.jsx`:** header with StatusBadge + pause/resume + delete. `ResponseChart` LineChart `responseTimeMs vs checkedAt` from `getLogs?days=7`, range switcher 24h/7d/30d. Table recent 20 logs: Time (date-fns), Status, Code, ms. Incident timeline below via `getIncidents?websiteId=`. Downsample to <300 points if large.

**`business-apps/page.jsx`:** same table pattern. Form: Name, URL, Type select `Website/Tally/ERP/CCTV/Payment` -> `addBusinessApp`. Type icon mapping. Note for CCTV/Tally IP:port help text.

**`audit/page.jsx`:** Button `Generate ISO Audit Report [12M v]` with period dropdown 1/3/6/12 -> `generateAudit` (long request, 60s timeout, progress state) -> show PDF preview `iframe pdfUrl` + download `<a>`. Table past reports from `listAudits`: period, uptime%, incidents, MTTR, createdAt, download.

**`status-page/[userId]/page.jsx`:** public, no auth, no Sidebar. Use `getPublicStatus`. Header logo + overall banner `All Systems Operational / Partial Outage`. Cards UP/DOWN with UptimeBar, 90-day badge. `Cache + auto-refresh 60s`. Shareable link copy button. Must work logged-out.

**`alerts/settings/page.jsx`:** toggles Email/WhatsApp/SMS/Call (custom Switch), Language select, Phones input (comma-separated, E.164 validate), Cooldown slider, Test Alert button -> `testAlert` + toast. Save -> `updateAlertSettings` debounced.

### 5. States, Errors, Performance

1.  Every fetch: `loading Skeleton / error Retry / empty EmptyState`. Never blank white.
2.  Auth guard: `(dashboard)` layout checks token, else `/login`. Public status bypasses.
3.  Polling: `usePolling(fn, 60000)` with cleanup, pause on tab hidden, backoff on 5xx.
4.  Logs chart: if `>1000` points, aggregate by hour client-side in `lib/format.js`.
5.  PDF: open in new tab, don't embed huge base64.

### 6. Run + Done Checklist (maps to PDF Sec.8)

```
npm run dev -> http://localhost:3000, ensure backend :5000 running + CORS FRONTEND_URL set
```

- [ ] Login stores token, 401 redirects
- [ ] Dashboard cards match `/dashboard/summary`, green/red correct
- [ ] Add website -> appears after 1 poll
- [ ] Website detail graph renders from `/logs`, recent 20 table
- [ ] Business apps add/list by type
- [ ] Audit generate -> PDF preview + download, past list loads
- [ ] Status page public works incognito, no token sent
- [ ] Alert toggles persist + test toast
