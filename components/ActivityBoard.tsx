"use client";

import { useMemo, useState } from "react";
import type { FeedItem } from "@/lib/feed";
import { formatStamp, sourceLabel } from "@/lib/format";
import { Card, Eyebrow, Pill, SearchField } from "./ui";

export function ActivityBoard({
  initial,
  googleFeed,
}: {
  initial: FeedItem[];
  googleFeed: boolean;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((entry) =>
      [entry.title, entry.detail, entry.source, entry.project]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rows]);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const sync = await fetch("/api/sync", { method: "POST" });
      const synced = (await sync.json()) as {
        results?: { channel: string; ok: boolean; detail: string }[];
        error?: string;
      };
      if (!sync.ok) throw new Error(synced.error || "Refresh failed");
      const feed = await fetch("/api/activity");
      const payload = (await feed.json()) as { feed?: FeedItem[] };
      if (payload.feed) setRows(payload.feed);
      const notes = (synced.results ?? [])
        .filter((item) =>
          ["google-feed", "github", "chatgpt"].includes(item.channel),
        )
        .map((item) => item.detail)
        .join(" ");
      setMessage(notes || "Feed updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Feed
        </p>
        <h1 className="display mt-2 text-4xl">Activity</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Gmail, Drive, Calendar, Cursor/GitHub, ChatGPT and Grok Bot in one
          list. Allow Google on Control panel. Refresh pulls the latest.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search activity"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
        <Pill>{googleFeed ? "Google allowed" : "Google needs Allow"}</Pill>
      </div>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
      <Card>
        <Eyebrow>
          {visible.length} {visible.length === 1 ? "item" : "items"}
        </Eyebrow>
        {visible.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing in the feed yet. Allow Google on Control panel, then
            Refresh.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {visible.map((entry) => (
              <li key={entry.id} className="py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {formatStamp(entry.ts)} · {sourceLabel(entry.source)}
                  {entry.project ? ` · ${entry.project}` : ""}
                </p>
                {entry.url ? (
                  <a
                    href={entry.url}
                    className="mt-1 block text-base font-medium text-copper hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {entry.title}
                  </a>
                ) : (
                  <p className="mt-1 text-base font-medium">{entry.title}</p>
                )}
                {entry.detail ? (
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {entry.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
