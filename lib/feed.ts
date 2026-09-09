import { getChangelog } from "./data";
import { listNotes, listTaskActivity } from "./db";

export type FeedItem = {
  id: string;
  ts: string;
  source: string;
  title: string;
  detail?: string;
  url?: string;
  project?: string;
};

function stamp(value: string): number {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

export function buildFeed(limit = 80): FeedItem[] {
  const notes: FeedItem[] = listNotes(limit).map((note) => ({
    id: `note-${note.id}`,
    ts: note.createdAt,
    source: note.source,
    title: note.title,
    detail: note.detail ?? undefined,
    url: note.url ?? undefined,
    project: note.project ?? undefined,
  }));
  const tasks: FeedItem[] = listTaskActivity(limit).map((entry) => ({
    id: `task-${entry.id ?? entry.taskId}-${entry.createdAt}`,
    ts: entry.createdAt,
    source: entry.actor.toLowerCase() === "ryan" ? "manual" : entry.actor.toLowerCase(),
    title: entry.action,
    detail: entry.result,
    project: entry.project,
  }));
  const log: FeedItem[] = getChangelog().map((entry, index) => ({
    id: `log-${index}-${entry.action}`,
    ts: stamp(entry.date) ? new Date(entry.date).toISOString() : entry.date,
    source: entry.actor.toLowerCase(),
    title: entry.action,
    detail: entry.result,
    url: entry.href,
    project: entry.project,
  }));
  return [...notes, ...tasks, ...log]
    .sort((a, b) => stamp(b.ts) - stamp(a.ts))
    .slice(0, limit);
}
