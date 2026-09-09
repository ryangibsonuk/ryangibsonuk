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

Task completion is **not** a JSON edit. Use the API so ChatGPT, Cursor and Grok stay in sync:

```
POST /api/integrations/tasks
x-control-centre-key: $CONTROL_CENTRE_API_KEY
{"taskId":"namecheap","completed":true,"actor":"Cursor","result":"…"}
```

Allowed actors: `ChatGPT`, `Cursor`, `Grok`. UI toggles use actor `Ryan` via `POST /api/tasks`.

MCP: `GET /api/mcp` lists tools. `POST /api/mcp` with `{ "method": "list_tasks" }` or `{ "method": "update_task", "params": { "taskId", "completed", "actor" } }`.

Gmail and Google Drive are **links only**. Do not claim two-way sync.

## Run

```
cp .env.example .env.local
npm install
npm run dev
```
