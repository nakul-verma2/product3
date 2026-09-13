# Env setup — backend + frontend

## Backend (`backend/.env`, gitignored — start from `backend/.env.example`)

| Var | Required | Value |
|---|---|---|
| `PORT` | no (default 5000) | API listen port |
| `MONGO_URI` | **yes** | Local `mongodb://127.0.0.1:27017/product3` **or** Atlas `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/product3?retryWrites=true&w=majority&appName=<cluster>` (URL-encode special chars in the password) |
| `JWT_SECRET` | **yes** | Long random string. Missing/invalid = crash on boot (by design) and all logins fail after rotation |
| `FRONTEND_URL` | no (default `http://localhost:3000`) | Must **exactly** match the frontend origin or browsers block API calls (CORS). Comma-separated for multiple domains |
| `WHATSAPP_TOKEN` | no | Meta System User token (`whatsapp_business_messaging`). Empty = sends are mock-logged, nothing breaks |
| `WHATSAPP_PHONE_ID` | no | Meta **Phone number ID** (not App ID) |
| `CHECK_INTERVAL` | no (default `* * * * *`) | node-cron schedule for the monitor |
| `LOG_RETENTION_DAYS` | no (default 90) | `UptimeLog` TTL — auto-deletes old checks |

## Frontend (`frontend/.env.local`, gitignored)

| Var | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` locally; prod `https://api.yourdomain.com/api` (requires rebuild) |

## Secrets hygiene

- `.env` / `.env.local` are gitignored at root and inside each app — never commit them, never paste them into issues.
- The Atlas password currently in `backend/.env` was shared in chat history: rotate it (Atlas → Database Access → Edit user) and update `.env` when convenient.
- Rotate `JWT_SECRET` before any shared/prod use — all existing tokens invalidate on rotation.
