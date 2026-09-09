# Ryan Gibson

Builder in Wakefield. I sold a portfolio of 20+ education sites (Clever Bytes Ltd) in 2021, and I am still building.

This repository is **Gibson HQ / Ryan Control Centre**, the git-backed version of the personal dashboard that started in ChatGPT.

```bash
cp .env.example .env.local
```

Set `DASHBOARD_PIN` in `.env.local` (the passcode on `/unlock`). Assistants keep using `CONTROL_CENTRE_API_KEY` on the integration routes.

## Live site (phone and desktop)

GitHub Pages cannot host this control panel. Pages only serves static files. Gibson HQ is a Node app with a passcode cookie and SQLite, so ticks would not survive and a Pages passcode would sit in the JavaScript.

Use the Docker image on a host with a disk. This repo includes `render.yaml` for [Render](https://render.com):

1. Open [Render Blueprints](https://dashboard.render.com/blueprints) and connect `ryangibsonuk/ryangibsonuk`.
2. Until this branch is on `main`, set the service branch to the HQ branch you deployed from.
3. Set **DASHBOARD_PIN** to your passcode (same value as `.env.local`). Leave it out of git.
4. Set **CONTROL_CENTRE_API_KEY** if ChatGPT, Cursor or Grok should call in.
5. Deploy. Render gives you an `https://….onrender.com` URL. Open that on your phone and computer, enter the passcode, use Control panel.
6. After it is live, add `{that-origin}/api/auth/google/callback` to the Google OAuth client.

SQLite lives on a 1 GB disk at `/var/lib/hq`, so task ticks survive deploys. Render’s starter plan is required for a persistent disk. Eight wrong passcodes from one address lock unlock for 15 minutes.

Fly.io with a volume at `/var/lib/hq` is the same app if you already use Fly.

**Docker** (laptop, if you still want localhost):

```bash
./scripts/docker-up.sh
```

Or `docker compose --env-file .env.local up --build`. Open [http://localhost:3000](http://localhost:3000). The container binds `0.0.0.0:3000`.

Without Docker:

```bash
npm install
npm run dev
```

The **control panel** is in the left nav (also `/teammates` or `/control-panel`). That is where you paste Google OAuth details, connect Gmail/Drive, save the ChatGPT app origin, and press Sync now.

| Page | What it is |
| --- | --- |
| Overview | Needs Ryan, upcoming dates, recurring content, change log |
| Projects | 13 lines of work from the register |
| Tasks | 16 tasks with live complete/reopen |
| Decisions | Standing rules (Andrew/Carl parked, inbox quiet, insurance) |
| Activity | Change log plus every task toggle |
| Links | Drive, trackers, live sites |
| Control panel | ChatGPT, Cursor, Grok, Google connect, Sync now |
| Grok | Full-page chat (`XAI_API_KEY`) |

## Two-way sync

Completing or reopening a task writes SQLite first (`data/hq.sqlite`, gitignored), then fans out:

- **Gmail:** HQ and HQ/Complete labels, mark read. Thread IDs come from `mail.google.com` links on the task.
- **Drive:** append a row to a sheet named Gibson HQ Sync. Folder-linked tasks upsert `hq-task-{id}.json` in that folder. Spreadsheet-linked tasks upsert a Gibson HQ tab on that sheet.
- **ChatGPT:** `POST {CHATGPT_APP_URL}/api/integrations/tasks` with actor Cursor when Ryan ticks in HQ.

Inbound is Teammates → Sync now, or `POST /api/sync`. That reads Gmail labels, Drive status files/tabs, and ChatGPT D1 states. Newer remote timestamps win; a missing Gmail HQ label is not treated as reopen.

Google needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then **Connect Google** on Teammates. Add the OAuth redirect `{origin}/api/auth/google/callback` and yourself as a test user (Gmail and Drive scopes are sensitive). ChatGPT needs the published app origin: paste it on Teammates or set `CHATGPT_APP_URL`. The ChatGPT app can also POST here as actor ChatGPT.

Without those credentials, ticks still save in HQ.

## Assistant API

```
POST /api/tasks
POST /api/integrations/tasks   # actor: ChatGPT | Cursor | Grok
POST /api/mcp                  # method: list_tasks | update_task | list_register
POST /api/sync                 # pull Gmail, Drive, ChatGPT
GET  /api/v1/register
```

Set `CONTROL_CENTRE_API_KEY` in production. Agents should read `AGENTS.md`.
