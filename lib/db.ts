import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getSeedTasks } from "./data";
import type { TaskActivity, TaskState } from "./types";
import type { UnlockGuardRow } from "./unlock-guard";

const dataDir =
  process.env.HQ_DATA_DIR?.trim() || join(process.cwd(), "data");
const dbPath = join(dataDir, "hq.sqlite");

let cached: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (cached) return cached;
  mkdirSync(dirname(dbPath), { recursive: true });
  const client = new DatabaseSync(dbPath);
  client.exec(`
    CREATE TABLE IF NOT EXISTS task_state (
      task_id TEXT PRIMARY KEY NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS task_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      project TEXT NOT NULL,
      result TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      source TEXT NOT NULL,
      project TEXT,
      title TEXT NOT NULL,
      detail TEXT,
      url TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      provider TEXT PRIMARY KEY NOT NULL,
      access_token TEXT,
      refresh_token TEXT NOT NULL,
      expiry TEXT,
      email TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      channel TEXT NOT NULL,
      ok INTEGER NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS unlock_guard (
      key TEXT PRIMARY KEY NOT NULL,
      fail_count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0
    );
  `);
  seedCompleted(client);
  cached = client;
  return client;
}

function seedCompleted(client: DatabaseSync) {
  const count = client.prepare("SELECT COUNT(*) AS n FROM task_state").get() as {
    n: number;
  };
  if (count.n > 0) return;
  const now = new Date().toISOString();
  const insert = client.prepare(
    `INSERT INTO task_state (task_id, is_completed, completed_at, updated_at, updated_by)
     VALUES (?, 1, ?, ?, 'Ryan')`,
  );
  for (const task of getSeedTasks()) {
    if (task.status !== "Complete") continue;
    insert.run(task.id, now, now);
  }
}

function asState(row: Record<string, unknown>): TaskState {
  return {
    taskId: String(row.task_id),
    isCompleted: Boolean(row.is_completed),
    completedAt: (row.completed_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
    updatedBy: String(row.updated_by),
  };
}

function asActivity(row: Record<string, unknown>): TaskActivity {
  return {
    id: Number(row.id),
    taskId: String(row.task_id),
    action: String(row.action),
    project: String(row.project),
    result: String(row.result),
    actor: String(row.actor),
    createdAt: String(row.created_at),
  };
}

export function listTaskStates(): TaskState[] {
  const rows = db().prepare("SELECT * FROM task_state").all() as Record<
    string,
    unknown
  >[];
  return rows.map(asState);
}

export function listTaskActivity(limit = 50): TaskActivity[] {
  const rows = db()
    .prepare(
      "SELECT * FROM task_activity ORDER BY created_at DESC, id DESC LIMIT ?",
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map(asActivity);
}

export function setTaskCompletion(input: {
  taskId: string;
  project: string;
  title: string;
  completed: boolean;
  actor: string;
  result?: string;
}): { state: TaskState; activity: TaskActivity } {
  const now = new Date().toISOString();
  const completedAt = input.completed ? now : null;
  const action = input.completed
    ? `Completed: ${input.title}`
    : `Reopened: ${input.title}`;
  const result =
    input.result?.trim() ||
    (input.completed
      ? "Task marked complete in Gibson HQ."
      : "Task returned to the active queue in Gibson HQ.");

  const client = db();
  client.exec("BEGIN");
  try {
    client
      .prepare(
        `INSERT INTO task_state (task_id, is_completed, completed_at, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(task_id) DO UPDATE SET
           is_completed = excluded.is_completed,
           completed_at = excluded.completed_at,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .run(
        input.taskId,
        input.completed ? 1 : 0,
        completedAt,
        now,
        input.actor,
      );

    const info = client
      .prepare(
        `INSERT INTO task_activity (task_id, action, project, result, actor, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(input.taskId, action, input.project, result, input.actor, now);

    client.exec("COMMIT");

    return {
      state: {
        taskId: input.taskId,
        isCompleted: input.completed,
        completedAt,
        updatedAt: now,
        updatedBy: input.actor,
      },
      activity: {
        id: Number(info.lastInsertRowid),
        taskId: input.taskId,
        action,
        project: input.project,
        result,
        actor: input.actor,
        createdAt: now,
      },
    };
  } catch (error) {
    client.exec("ROLLBACK");
    throw error;
  }
}

export function appendNote(input: {
  source: string;
  project?: string;
  title: string;
  detail?: string;
  url?: string;
}) {
  const createdAt = new Date().toISOString();
  const info = db()
    .prepare(
      `INSERT INTO notes (source, project, title, detail, url, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.source,
      input.project ?? null,
      input.title,
      input.detail ?? null,
      input.url ?? null,
      createdAt,
    );
  return { id: Number(info.lastInsertRowid), createdAt, ...input };
}

export type OAuthToken = {
  provider: string;
  accessToken: string | null;
  refreshToken: string;
  expiry: string | null;
  email: string | null;
  updatedAt: string;
};

export function getOAuthToken(provider: string): OAuthToken | null {
  const row = db()
    .prepare("SELECT * FROM oauth_tokens WHERE provider = ?")
    .get(provider) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    provider: String(row.provider),
    accessToken: (row.access_token as string | null) ?? null,
    refreshToken: String(row.refresh_token),
    expiry: (row.expiry as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

export function saveOAuthToken(token: {
  provider: string;
  accessToken?: string | null;
  refreshToken: string;
  expiry?: string | null;
  email?: string | null;
}) {
  const now = new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO oauth_tokens (provider, access_token, refresh_token, expiry, email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expiry = excluded.expiry,
         email = COALESCE(excluded.email, oauth_tokens.email),
         updated_at = excluded.updated_at`,
    )
    .run(
      token.provider,
      token.accessToken ?? null,
      token.refreshToken,
      token.expiry ?? null,
      token.email ?? null,
      now,
    );
}

export function clearOAuthToken(provider: string) {
  db().prepare("DELETE FROM oauth_tokens WHERE provider = ?").run(provider);
}

export function logSync(channel: string, ok: boolean, detail: string) {
  db()
    .prepare(
      `INSERT INTO sync_log (channel, ok, detail, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(channel, ok ? 1 : 0, detail.slice(0, 2000), new Date().toISOString());
}

export function listSyncLog(limit = 20) {
  const rows = db()
    .prepare(
      "SELECT * FROM sync_log ORDER BY id DESC LIMIT ?",
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: Number(row.id),
    channel: String(row.channel),
    ok: Boolean(row.ok),
    detail: String(row.detail),
    createdAt: String(row.created_at),
  }));
}

export function getSetting(key: string): string | null {
  const row = db()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value?: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function deleteSetting(key: string) {
  db().prepare("DELETE FROM settings WHERE key = ?").run(key);
}

export function getUnlockGuard(key: string): UnlockGuardRow | null {
  const row = db()
    .prepare(
      "SELECT fail_count, window_start, locked_until FROM unlock_guard WHERE key = ?",
    )
    .get(key) as
    | { fail_count: number; window_start: number; locked_until: number }
    | undefined;
  if (!row) return null;
  return {
    failCount: Number(row.fail_count),
    windowStart: Number(row.window_start),
    lockedUntil: Number(row.locked_until),
  };
}

export function saveUnlockGuard(key: string, row: UnlockGuardRow) {
  db()
    .prepare(
      `INSERT INTO unlock_guard (key, fail_count, window_start, locked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         fail_count = excluded.fail_count,
         window_start = excluded.window_start,
         locked_until = excluded.locked_until`,
    )
    .run(key, row.failCount, row.windowStart, row.lockedUntil);
}

export function clearUnlockGuard(key: string) {
  db().prepare("DELETE FROM unlock_guard WHERE key = ?").run(key);
}
