# API Reference — base `http://localhost:5000/api`

Auth: `Authorization: Bearer <JWT>` unless marked Public.

## Auth
- `POST /auth/register {email,password>=8}` → 201 `{token,user}` · 409 duplicate
- `POST /auth/login {email,password}` → `{token,user}` · 401 invalid · rate-limited 100/15min

## Websites (Auth)
- `POST /websites/add {name,url}` → 201 site + background first check · 400 bad url/DNS · 409 duplicate
- `GET /websites/list` → `[site]` (raw array, matches `lib/api.js` + demo shape)
- `GET /websites/:id` → site · 404 (owner-checked, no existence leak)
- `GET /websites/:id/logs?days=7&page=1&limit=100` → `[log]` asc, limit ≤500
- `DELETE /websites/:id` → `{ok:true}` + deletes logs + incidents
- `PATCH /websites/:id/pause {isPaused}` → site (`paused` stops cron + alerts)

Site: `{_id,userId,name,url,status:up|down|paused,isPaused,uptimePercent,avgResponseMs,sslExpiryDate,lastCheckedAt,consecutiveFailures}`

## Dashboard / Incidents (Auth)
- `GET /dashboard/summary` → `{total,up,down,businessApps,recentIncidents}`
- `GET /incidents?websiteId=` → `[incident]` newest first (owner-checked)

## Business apps (Auth) — prefix `/monitor`
- `POST /monitor/business-app/add {name,url,type:website|tally|erp|cctv|payment_gateway}` → 201 (bare `IP:port` → TCP check)
- `GET /monitor/business-app/list` → `[app]`
- `DELETE /monitor/business-app/:id` → `{ok:true}`

## Audit (Auth)
- `GET /audit/report/generate?period=1month|3months|6months|12months` → `{report:{_id,period,uptimePercent,incidents,mttrMinutes,pdfUrl:/reports/*.pdf}}`
- `GET /audit/reports/list` → `[report]`

## Alerts (Auth)
- `GET /alerts/settings` → settings (auto-created)
- `PUT /alerts/settings {emailEnabled,whatsappEnabled,smsEnabled,callEnabled,language,phones[],cooldownMinutes,onlyOnStatusChange}` → `{ok,settings}`
- `POST /alerts/test {channel}` → `{ok:true}` (logged)
- `GET /alerts/history` → `[notificationLog]`
- `POST /alerts/whatsapp` + legacy `POST /alert/whatsapp {websiteId,message}` → cooldown-guarded send

## AI (Auth)
- `POST /ai/root-cause {statusCode,error,responseTimeMs,isUp}` → `{rootCause,actionHint}`

## Public
- `GET /status/:userId` — no auth, `Cache-Control: max-age=60` → `{userId,overall:operational|degraded,services:[{_id,name,url(masked),status,uptimePercent,avgResponseMs,segments[30]}]}`
- `GET /health` — `{ok,mongo:up|down,uptimeSec,cronLastRun}`

## Errors
`{message}` with 400 validation, 401 auth, 403/404 owner-checked, 409 duplicate, 429 rate-limit, 5xx server.
