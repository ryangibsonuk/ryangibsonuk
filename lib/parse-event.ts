import { isSource, SOURCES, type ActivityEvent } from "./types";

export function newEventId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseIncomingEvent(body: unknown): ActivityEvent | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Expected a JSON object" };
  }
  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { error: "title is required" };

  const sourceRaw = typeof input.source === "string" ? input.source : "manual";
  const source = isSource(sourceRaw) ? sourceRaw : null;
  if (!source) {
    return { error: `source must be one of ${SOURCES.join(", ")}` };
  }

  return {
    id: typeof input.id === "string" && input.id ? input.id : newEventId(source),
    ts: typeof input.ts === "string" && input.ts ? input.ts : new Date().toISOString(),
    source,
    project: typeof input.project === "string" ? input.project : undefined,
    title,
    detail: typeof input.detail === "string" ? input.detail : undefined,
    url: typeof input.url === "string" ? input.url : undefined,
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
  };
}
