# Backend — Website Care & Uptime Monitoring

Express + Mongoose. Implements `plan.md` (hardened) covering `info.pdf` Sec 3–4 + 7.

## Quick start

```bash
cd backend
cp .env.example .env   # fill MONGO_URI + JWT_SECRET
npm install
npm start              # node src/server.js — API :5000 + cron auto-starts
```

Frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`, send `Authorization: Bearer <token>` except `GET /api/status/:userId` and `GET /api/health`.

## Layout (`backend/`)

```
src/
  config/env.js, config/db.js
  app.js               # middleware, CORS, static /reports, route mounting
  server.js            # db -> cron -> listen + graceful shutdown
  middleware/protect.js, errorHandler.js, validate.js
  models/User, Website, UptimeLog, Incident, BusinessApp, AlertSettings, NotificationLog, AuditReport
  controllers/*        # request logic per domain
  routes/auth, websites, dashboard, monitor, audit, alerts, status, ai
  services/checker.js  # HTTP + TCP probe
  services/rootCause.js# pure diagnose() — shared by route + cron
  services/whatsapp.js # cooldown + Meta send + NotificationLog
  services/pdfReport.js# pdfkit stream-to-disk
  jobs/monitorCron.js  # 1-min p-limit(10) checks, flap guard, transition incidents
  utils/url.js         # normalize, parseTarget, assertPublicHost, maskUrl
```

## Decisions (backend-architect)

- Contract-first REST, JWT `req.user.id` — never trust `userId` from client (plan Sec 0).
- `Website{userId,url}` unique; `UptimeLog` TTL 90d + `{websiteId,checkedAt}` index; `Incident{websiteId,status}` index.
- Cron: overlap lock, `.lean()` batch 500, concurrency-10 limiter, 10s timeout, flap guard `consecutiveFailures>=2`, transition-only incidents/alerts.
- Alerts: `AlertSettings.cooldownMinutes` + `onlyOnStatusChange` + `NotificationLog` history.
- Audit PDF streams to `backend/public/reports/*.pdf`, served at `/reports/*`.
- Public status sanitized (`name, urlMasked, status, uptime, segments`) + `Cache-Control: max-age=60`.

See the other files in this folder for the full API, architecture diagram, frontend wiring, and ops runbook.
