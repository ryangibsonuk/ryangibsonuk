# Ryan Gibson

Builder in Wakefield. I sold a portfolio of 20+ education sites (Clever Bytes Ltd) in 2021, and I am still building.

This repository is **Gibson HQ / Ryan Control Centre** — the git-backed version of the personal dashboard that started in ChatGPT.

The ChatGPT app is live, but it was a seeded interface. Completions there should not be treated as synced with Gmail, Drive or the other bots. This repo is the source of truth going forward.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional `DASHBOARD_PIN` locks the UI.

| Page | What it is |
| --- | --- |
| Overview | Needs Ryan, upcoming dates, recurring content, change log |
| Projects | 13 lines of work from the register |
| Tasks | 16 tasks with live complete/reopen |
| Decisions | Standing rules (Andrew/Carl parked, inbox quiet, insurance) |
| Activity | Change log plus every task toggle |
| Links | Drive, trackers, live sites |
| Teammates | ChatGPT, Cursor, Grok Bot, in-dashboard Grok |
| Grok | Full-page chat (`XAI_API_KEY`) |

Live task state is SQLite (`data/hq.sqlite`, gitignored). Assistants share it:

```
POST /api/tasks
POST /api/integrations/tasks   # actor: ChatGPT | Cursor | Grok
POST /api/mcp                  # method: list_tasks | update_task | list_register
GET  /api/v1/register
```

Set `CONTROL_CENTRE_API_KEY` in production. Agents should read `AGENTS.md`.
