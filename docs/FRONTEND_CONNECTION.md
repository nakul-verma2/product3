# Frontend ↔ Backend connection (production-grade)

## Env
- Backend `.env`: `PORT=5000`, `MONGO_URI=...`, `JWT_SECRET=...`, `FRONTEND_URL=http://localhost:3000` (comma-separated for prod domains).
- Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api` (prod: `https://api.yourdomain.com/api`).

## Wiring (already in `frontend/lib/api.js`)
- `apiClient` attaches `Bearer` from `localStorage.token`; `publicClient` never sends it (status page works incognito).
- 401 → clear storage + redirect `/login` (except public pages). 429/5xx → normalized `{message,status}` shown inline.
- `resolvePdfUrl('/reports/x.pdf')` prefixes API origin — PDFs are served cross-origin by `helmet(crossOriginResourcePolicy)` + `cors(origin: FRONTEND_URL)`.

## Contract map (verified against pages)
| Page | Calls | Backend |
|---|---|---|
| login | `login()` | `POST /auth/login` |
| dashboard | `getSummary + listWebsites + listBusinessApps` (parallel, 60s poll) | `GET /dashboard/summary`, `GET /websites/list`, `GET /monitor/business-app/list` |
| add-website | `addWebsite(name,url)` | `POST /websites/add` (409 surfaces inline) |
| website/[id] | `getWebsite + getLogs{days,limit:200} + getIncidents` | `GET /websites/:id`, `GET /websites/:id/logs`, `GET /incidents?websiteId=` |
| business-apps | `add/list/deleteBusinessApp` | `POST/GET/DELETE /monitor/business-app/*` |
| audit | `generateAudit(period) + listAudits` (60s timeout, iframe preview) | `GET /audit/report/generate?period=`, `GET /audit/reports/list` |
| status/[userId] | `getPublicStatus` via `publicClient` | `GET /status/:userId` (cached, masked) |
| alerts/settings | `get/updateAlertSettings + testAlert` (debounced) | `GET/PUT /alerts/settings`, `POST /alerts/test` |

## CORS checklist
1. `FRONTEND_URL` must exactly match the Next.js origin (`http://localhost:3000`, no trailing slash).
2. PDFs load via `<iframe src="http://localhost:5000/reports/...">` — no auth header needed.
3. If prod frontend is `https://app.x.com`, set `FRONTEND_URL=https://app.x.com` and `NEXT_PUBLIC_API_URL=https://api.x.com/api`.

## Failure modes handled
Backend validates + dedupes (400/409) so frontend toasts are meaningful; pause stops alert spam; logs capped (`limit≤500`) so `recharts` never OOMs; public route never 401s.
