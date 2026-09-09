import type { ActivityEvent } from "./types";

const LOCAL_KEY = "gibson-hq.activity";
const GROK_KEY = "gibson-hq.grok";
const FOCUS_KEY = "gibson-hq.focus-done";

export function loadLocalEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalEvents(events: ActivityEvent[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
}

export function addLocalEvent(
  input: Omit<ActivityEvent, "id" | "ts"> & { id?: string; ts?: string },
): ActivityEvent {
  const event: ActivityEvent = {
    id: input.id ?? `local-${crypto.randomUUID()}`,
    ts: input.ts ?? new Date().toISOString(),
    source: input.source,
    project: input.project,
    title: input.title.trim(),
    detail: input.detail?.trim() || undefined,
    url: input.url?.trim() || undefined,
    tags: input.tags,
  };
  const next = [event, ...loadLocalEvents().filter((item) => item.id !== event.id)];
  saveLocalEvents(next);
  return event;
}

export type StoredChat = { role: "user" | "assistant"; content: string };

export function loadGrokChat(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GROK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGrokChat(messages: StoredChat[]) {
  window.localStorage.setItem(GROK_KEY, JSON.stringify(messages.slice(-40)));
}

export function loadFocusDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FOCUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function saveFocusDone(map: Record<string, boolean>) {
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(map));
}
