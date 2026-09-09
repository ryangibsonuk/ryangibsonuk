<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ryan Control Centre — agent contract

This is Ryan Gibson’s HQ. The ChatGPT Control Centre supplied the register. This app is the version-controlled source.

Do not chase Andrew Armitage or Carl Davies. Do not invent work for FamilyCycling. British English, no em dashes.

## Source of truth

| File | Contents |
| --- | --- |
| `data/projects.json` | 13 projects |
| `data/tasks.json` | 16 tasks (seeded status) |
| `data/decisions.json` | Standing rules |
| `data/schedules.json` | Recurring content |
| `data/links.json` | Drive / site records |
| `data/changelog.json` | Historic log |
| `data/hq.sqlite` | Live completions (gitignored) |

Task completion is **not** a JSON edit. Use the API so ChatGPT, Cursor and Grok stay in sync, then HQ fans out to Gmail, Drive and the published ChatGPT app:

```
POST /api/integrations/tasks
x-control-centre-key: $CONTROL_CENTRE_API_KEY
{"taskId":"namecheap","completed":true,"actor":"Cursor","result":"…"}
```

Allowed actors: `ChatGPT`, `Cursor`, `Grok`. UI toggles use actor `Ryan` via `POST /api/tasks`.

MCP: `GET /api/mcp` lists tools. `POST /api/mcp` with `{ "method": "list_tasks" }` or `{ "method": "update_task", "params": { "taskId", "completed", "actor" } }`.

## Two-way sync

Completing a task in HQ fans out:

- Gmail: HQ and HQ/Complete labels, mark read (thread IDs from mail.google.com links)
- Drive: append a row to Gibson HQ Sync; folder links upsert `hq-task-{id}.json`; spreadsheet links upsert a Gibson HQ tab
- ChatGPT: POST `{CHATGPT_APP_URL}/api/integrations/tasks`

Inbound: Teammates → Sync now, or `POST /api/sync`. ChatGPT can also POST here as actor ChatGPT.

Google activity: paste the Apps Script from Control panel, click Allow, save the web app URL. Cursor appears via GitHub events. ChatGPT and Grok Bot POST `/api/ingest`.

Optional OAuth client is only for two-way Gmail labels on tasks.

Gmail and Drive writes only happen after OAuth. Without credentials, HQ still stores the tick locally.

## Run

```
cp .env.example .env.local
./scripts/docker-up.sh
```

Without Docker: `npm install` then `npm run dev`.

Live hosting is Docker on Render (`render.yaml`), not GitHub Pages. Production requires `DASHBOARD_PIN`. SQLite must sit on a persistent disk (`HQ_DATA_DIR=/var/lib/hq`).
