# Runbook

## Boot
`npm start` → validates env (crash-fast) → connects Mongo → starts cron → listens. `GET /api/health` should show `mongo:up`.

## Common issues
- **CORS error in Next.js**: `FRONTEND_URL` mismatch. Must equal the page origin.
- **401 loop**: expired JWT — frontend clears + redirects. Re-login.
- **409 on add**: already monitored (`{userId,url}` unique). Delete or reuse.
- **No logs after 2 min**: cron `lastRun` stale? Check `CHECK_INTERVAL` syntax, Mongo up, target not `isPaused`.
- **WhatsApp not arriving**: check `AlertSettings` toggles + `phones[]` + `cooldownMinutes`; `GET /alerts/history` shows `skipped:cooldown|disabled` vs `failed` (Meta error body in `error`).

## WhatsApp setup (Meta Cloud API)
1. developers.facebook.com → create app → add **WhatsApp** product → use the test sender number or connect your own.
2. Copy **Phone number ID** → `WHATSAPP_PHONE_ID`; create a System User token with `whatsapp_business_messaging` → `WHATSAPP_TOKEN`. Put both in `backend/.env`, restart.
3. In-app `alerts/settings`: enable WhatsApp, add recipient in E.164 (`+91…`), hit **Send test** — failures surface as a 502 with Meta's reason; history logs every attempt.
4. Caveats: without credentials sends are **mock-logged** (visible in history, nothing delivered). Meta only allows freeform text inside the 24 h customer-service window — for cold numbers you need an approved **message template** (next step if you onboard real on-call numbers).
- **PDF 404**: `public/reports/` is gitignored + served at `/reports`. Ensure disk writable.
- **Log growth**: TTL `LOG_RETENTION_DAYS=90` auto-prunes. Never disable in prod.

## Manual probes
```bash
curl -s localhost:5000/api/health
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"ops@x.com","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s localhost:5000/api/websites/list -H "Authorization: Bearer $TOKEN"
curl -s "localhost:5000/api/websites/<id>/logs?days=7&limit=5" -H "Authorization: Bearer $TOKEN"
```

## Scaling next
>500 targets: raise Mongo pool, add Redis for cooldown, shard cron by `userId` hash, move PDF gen to a worker queue.
