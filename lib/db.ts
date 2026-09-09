import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getSeedTasks } from "./data";
import type { TaskActivity, TaskState } from "./types";

const dbPath = join(process.cwd(), "data", "hq.sqlite");

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
