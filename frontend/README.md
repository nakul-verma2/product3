# Pulseboard — Frontend

Simple website-care and uptime-monitoring dashboard.
It shows all your websites and business apps in one place:
are they up, how fast they respond, and what went down and when.

> Plain-language guide. The detailed build spec lives in `plan.md`
> (frontend) and `../plan.md` (backend). Product background: `../info.pdf`.

---

## 1. What you need

- **Node.js** (v20 or newer) and **npm**
- The **backend running** at `http://localhost:5000`
  (this frontend only displays data — it cannot work without the backend)

## 2. First-time setup

```bash
cd frontend
npm install
```

Create a file named `.env.local` inside `frontend/` with one line:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

That single address is used by the whole app — no page hardcodes URLs.

## 3. Run it

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.
You will land on the login page. Log in, and you reach the dashboard.

> **No backend yet?** Click **“Explore demo — no sign-in needed”**
> on the login page. It loads sample data (5 sites, apps, incidents,
> reports) so you can browse every page with the frontend alone.
> Click the logout icon in the sidebar to leave demo mode.

Other commands:

| Command         | What it does                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the app for development             |
| `npm run build` | Check that everything compiles for deploy |
| `npm run lint`  | Check code style (must be clean)          |

## 4. Pages (what each screen does)

| Page                    | Route                  | What it does                                          |
| ----------------------- | ---------------------- | ----------------------------------------------------- |
| Redirect                | `/`                    | Sends you to `/dashboard` or `/login` automatically   |
| Login                   | `/login`               | Sign in, saves your login token                       |
| Dashboard               | `/dashboard`           | KPI cards (Total / Up / Down / Apps) + websites table |
| Add website             | `/add-website`         | Form to add a site; checks start within a minute      |
| Website detail          | `/website/[id]`        | Response-time graph, recent checks, incident timeline |
| Business apps           | `/business-apps`       | Monitor Tally / ERP / CCTV / Payment endpoints        |
| Audit reports           | `/audit`               | Generate ISO-style PDF reports, view past ones        |
| Alerts settings         | `/alerts/settings`     | Turn channels on/off, phones, cooldown, test alerts   |
| Public status page      | `/status-page/[userId]`| Shareable page that works **without login**           |

Top search bar filters the dashboard table. Data refreshes every 60 seconds.

## 5. How it talks to the backend

- All API calls go through **`lib/api.js`** — one file, one address.
- After login, your token is saved in the browser and sent automatically.
- If the token expires (error 401), you are sent back to `/login`.
- Big log payloads are capped (`limit=200`) and shrunk in the browser
  before drawing charts, so pages stay fast.

## 6. Project structure (where things live)

```
frontend/
  app/                  pages (one folder per route above)
  components/
    layout/             sidebar + top bar + login guard (AppShell)
    ui/                 cards, status badges, skeletons, toasts
    charts/             response-time chart + 30-segment uptime bar
  hooks/                data fetching (useApi), auto-refresh (usePolling)
  lib/
    api.js              every backend call, in one place
    format.js           numbers, dates, URL checks, chart helpers
  .opencode/skills/     frontend-design skill (design rules the app follows)
  plan.md               detailed technical spec
```

## 7. Design rules (kept simple on purpose)

- Light gray background, white cards, dark sidebar.
- Only three meaningful colors: **green = up, red = down, amber = paused/warning**.
- Dense tables with small text (like Vercel Status / Datadog), no big marketing heroes.
- Almost no animation — just quick fades and a pulsing dot on down sites.

## 8. How to verify it works (needs backend running)

1. `npm run dev` → open `http://localhost:3000`
2. Log in → token is saved, dashboard loads
3. Dashboard cards match the backend summary
4. Add a website → it appears after ~1 minute
5. Open the site → graph + last 20 checks render
6. Open the status page in an incognito window → works without login
7. Toggle an alert setting → it persists after reload

## 9. If something breaks

| Problem                              | Fix                                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| Blank page / login fails             | Is the backend running on port 5000? Is `.env.local` set? |
| Logged out suddenly                  | Token expired (7 days) — just log in again                 |
| `EALLOWSCRIPTS` error on `npm install` | Run `npm install --ignore-scripts` instead (npm config issue on this machine) |
| Port 3000 busy                       | Run `npm run dev -- -p 3100` to use another port           |

## 10. Notes

- **No `requirements.txt` needed.** That file is for Python projects.
  Here, `package.json` lists dependencies and `package-lock.json`
  pins exact versions — together they do the same job.
- `skills-lock.json` is committed (restores the design skill on other machines).
- `.env.local`, `node_modules/`, and `.next/` are git-ignored and never committed.
