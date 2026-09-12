# PRODUCT 03 - Backend Implementation Plan
### Website Care & Uptime Monitoring - Node.js + MongoDB
**Scope: Backend only. Frontend ignored, but all connectors exposed.**

This follows your `info.pdf` 1:1, with hardening for production failures.

---

### 0. Ground Rules (fixes to PDF naivety)

1.  **Never trust `userId` from query/body.** PDF says `GET /api/audit/report/generate?userId=` - replace with `req.user.id` from JWT. Only public route takes `userId` param: `GET /api/status/:userId`.
2.  **PDF structure is too flat.** Use `backend/src/` layered: `config / middleware / models / routes / controllers / services / jobs / utils`.
3.  **Missing deps in PDF:** add `helmet morgan express-rate-limit express-validator dayjs p-limit ssl-checker`
4.  `npm i express mongoose cors dotenv jsonwebtoken bcryptjs axios node-cron pdfkit helmet morgan express-rate-limit express-validator p-limit`

### 1. Config & App Bootstrap

**Files:**
`src/config/env.js, src/config/db.js, app.js, server.js`

1.  Validate `.env` on boot: `MONGO_URI, JWT_SECRET, PORT, FRONTEND_URL, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID`. Crash fast if missing.
2.  `app.js`: `cors({origin: FRONTEND_URL}) + helmet() + morgan() + express.json({limit:10kb}) + /public/reports static + rate-limit auth routes + global errorHandler`.
3.  `server.js`: connect mongo -> start express -> start `monitorCron.js`. Graceful shutdown.
4.  Add `GET /api/health` -> `{mongo, uptime, cronLastRun}` for frontend + deployment probe.

> **Future error fixed:** CORS crash with Next.js, unhandled promise rejection killing cron, missing env in prod.

### 2. Hardened Models (from PDF Sec.3)

Keep PDF fields, add this:

**`User.js`:** `email {unique, lowercase, index}, passwordHash, phone, language, createdAt`. Add pre-save email normalize. Never return hash.

**`Website.js`:** `userId{index}, url{validated}, name, status:{enum:[up,down,paused], default:up}, uptimePercent, avgResponseMs, sslExpiryDate, lastCheckedAt, lastStatusChangeAt, consecutiveFailures, checkIntervalSec{default:60}, isPaused`. Compound index `{userId, url:1} unique` -> prevents duplicate add.

**`UptimeLog.js`:** `websiteId{index}, targetType:{enum:[Website,BusinessApp]}, statusCode, responseTimeMs, isUp, error, checkedAt{default:now}` + **TTL index `expireAfterSeconds: 90 days`** + index `{websiteId, checkedAt}`. This is critical - PDF's 1-min cron = 43k docs/site/month, will OOM without TTL + pagination.

**`Incident.js`:** `websiteId, targetType, startedAt, endedAt, durationMinutes, status:{ongoing,resolved}, rootCause, resolvedAutomatically`. Index `{websiteId, status}` for fast ongoing lookup.

**`BusinessApp.js`:** PDF has no logs linkage. Fix: reuse `UptimeLog` + `Incident` via `targetType`. Add `userId{index}, name, url, type{enum:[website,tally,erp,cctv,payment_gateway]}, status, lastChecked, checkMethod:{http,tcp,ping}` - CCTV/Tally are often IP:port with no HTTP, need TCP check fallback.

**NEW `AlertSettings.js` (missing in PDF but required by `alerts/settings` page):** `userId{unique}, emailEnabled, whatsappEnabled, smsEnabled, callEnabled, phones[], cooldownMinutes{default:15}, onlyOnStatusChange{default:true}`

**NEW `NotificationLog.js`:** `userId, websiteId, channel, message, status, error, sentAt` - for audit + retry.

**`AuditReport.js`:** Keep PDF + add `periodStart, periodEnd, totalChecks, upChecks, breakdownBySite[]`.

### 3. Auth - `POST /api/auth/register, /login`

1.  Validate: `isEmail(), password len>=8` with `express-validator`.
2.  `bcrypt.hash(password,12)`, duplicate email -> 409, not 500.
3.  Login: compare -> `jwt.sign({id}, JWT_SECRET, {expiresIn:7d})` -> return `{token, user:{id,email}}`.
4.  Middleware `protect`: parse `Bearer`, verify, attach `req.user`. All routes except `status/:userId` + `health` use it.

> **Fixed:** No rate-limit -> brute force. Add 100 req/15min on auth. No timing attack leak.

### 4. Websites - Frontend Core Connector

```
POST /api/websites/add        [Auth] {name, url} -> normalizeUrl, validate http(s), dns lookup, reject private IP, check duplicate -> create + immediate first check
GET  /api/websites/list       [Auth] -> list with status, avgResponseMs, uptimePercent (no logs populated)
GET  /api/websites/:id        [Auth + ownerCheck] -> single + last 24h stats
DELETE /api/websites/:id      [Auth] -> delete website + logs + incidents (NEW - PDF missing, frontend needs it)
PATCH /api/websites/:id/pause [Auth] {isPaused} (NEW - stop alert spam during maintenance)
GET  /api/websites/:id/logs?days=7&page=1&limit=100 [Auth] -> sorted asc, capped. For graph: aggregate to 200 points if >1000 logs.
GET  /api/dashboard/summary   [Auth] (NEW) -> {total, up, down, businessApps, recentIncidents} - powers dashboard cards in 1 call
GET  /api/incidents?websiteId= [Auth] -> ongoing + resolved list
```

All owner checks: `Website.userId == req.user.id` else 403/404 (don't leak existence).

### 5. Monitoring Engine - `cron.js` Rewrite

PDF: `* * * * * loop all + axios 10s` will fail at scale.

**Plan:**

1.  `node-cron` every 1-min, with `isRunning` lock to prevent overlap.
2.  Fetch only `isPaused=false` with `.lean()`, batch 500.
3.  Concurrency with `p-limit(10)`, not `for...of await`. Each check:
    ```
    start=Date.now()
    axios.get(url, {timeout:10000, validateStatus:()=>true, maxRedirects:5})
    responseTimeMs=Date.now()-start
    isUp = statusCode <400
    ```
4.  Catch: `ECONNABORTED -> timeout, ENOTFOUND -> DNS, CERT_HAS_EXPIRED -> SSL, ECONNREFUSED -> down`.
5.  SSL check separately 1x/day: parse cert expiry -> update `sslExpiryDate`. Alert if <14 days.
6.  Write `UptimeLog`, update `Website {status, avgResponseMs=rolling avg 20, lastCheckedAt, uptimePercent=recalc lazy, consecutiveFailures}`.
7.  **Incident logic:** Only on transition:
    `up->down: create Incident{ongoing} + alert`
    `down->up: close ongoing Incident{endedAt, durationMinutes, resolved} + send recovery`
    `down->down: do NOT create/alert (respect cooldown)`
8.  Flap guard: require `consecutiveFailures>=2` before marking down to avoid 1 blip = false alert.

> **Fixed:** Overlapping crons, 10s serial blocking 100 sites=16min lag, log explosion, single-failure false positive, SSL never actually checked.

### 6. Root-Cause - `POST /api/ai/root-cause`

Expand PDF rules to service `rootCause.js` (pure function, also called internally by cron, not just HTTP):

```
0 / ENOTFOUND -> DNS / Server Down
CERT / SSL -> SSL Expired / Invalid
500-599 -> Server Error
404 -> Page Missing (not down, but warn)
403 -> Blocked / WAF
timeout / ECONNABORTED -> Server Slow / Timeout
responseTimeMs>3000 + isUp -> Degraded Performance
```

Return `{rootCause, actionHint}`. Frontend shows hint.

### 7. Alerts - `POST /api/alert/whatsapp + settings`

1.  `POST /api/alerts/whatsapp` internal: `{websiteId, message}` -> check `AlertSettings.cooldownMinutes` + `NotificationLog` last sent -> skip if spam -> call Meta API `POST https://graph.facebook.com/v20.0/{PHONE_ID}/messages` -> log success/fail.
2.  Queue: on fail, save to `NotificationLog{status:failed}` + retry next cron 1x, don't throw to cron.
3.  Expose to frontend:
    ```
    GET/PUT /api/alerts/settings [Auth] -> toggles Email, WhatsApp, SMS, Call + phones + language
    POST /api/alerts/test [Auth] {channel} -> sends test alert
    GET /api/alerts/history [Auth] -> from NotificationLog
    ```
> **Fixed:** PDF would send WhatsApp every minute while down. Cooldown + onlyOnStatusChange solves it. Missing settings model added.

### 8. Business Apps - `POST /api/monitor/business-app/*`

Same engine as websites, different checker:

```
POST /api/monitor/business-app/add [Auth] {name,url,type}
GET  /api/monitor/business-app/list [Auth]
DELETE /api/monitor/business-app/:id [Auth] (NEW)
```

If `type=cctv/tally/erp` and URL is `http://192.168.x:port` -> use TCP connect check, not axios. Frontend dropdown maps directly to `type` enum.

### 9. Audit Report - `GET /api/audit/report/generate?period=12months`

1.  Auth + `period in [1,3,6,12months]` (PDF's `userId=.=12months` typo fixed).
2.  Aggregate from `UptimeLog`: `uptime% = up/total*100`, `incidents count`, `MTTR = avg(durationMinutes resolved)`.
3.  Generate PDF with `pdfkit` **async to disk** `public/reports/{userId}-{timestamp}.pdf` - don't buffer in memory. Include table per site + incident list + MTTR.
4.  Create `AuditReport`, return `{pdfUrl:/reports/...pdf, stats}`.
5.  NEW: `GET /api/audit/reports/list` for `audit/page.jsx` past reports table.

> **Fixed:** PDF gen blocks event loop, no list API, division by zero when no logs, unbounded 12-month query -> use aggregation + limit.

### 10. Public Status - `GET /api/status/:userId`

No auth. `sanitize`: return only `{name, urlMasked, status, uptimePercent}`. Add `Cache-Control: public, max-age=60` to survive traffic spike. This powers `status-page/[userId]`.

### 11. Frontend Connectors Checklist (ensure these exist)

Frontend team needs baseURL `http://localhost:5000/api` + `Authorization: Bearer <token>`:
`register, login, websites/add, websites/list, websites/:id, websites/:id/logs, dashboard/summary, monitor/business-app/add+list, audit/report/generate+reports/list, alerts/settings+test, status/:userId, ai/root-cause, health` - all JSON except PDF url.

### 12. .env + Run

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/product3
JWT_SECRET=long_random
FRONTEND_URL=http://localhost:3000
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
CHECK_INTERVAL=* * * * *
LOG_RETENTION_DAYS=90
```

Run: `node src/server.js` (starts cron auto). Test order: `register->add website->list->wait 2min->logs non-empty->kill site->incident ongoing->recover->resolved->generate audit PDF->public status`.
