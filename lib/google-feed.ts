import { getSetting, logSync, upsertNote } from "./db";
import { skipped, type SyncResult } from "./google";

export function googleFeedConfigured(): boolean {
  return Boolean(googleFeedUrl());
}

export function googleFeedUrl(): string {
  return (
    process.env.GOOGLE_SCRIPT_URL?.trim() ||
    getSetting("google_script_url") ||
    ""
  ).replace(/\/$/, "");
}

function googleFeedToken(): string {
  return (
    process.env.GOOGLE_SCRIPT_TOKEN?.trim() ||
    getSetting("google_script_token") ||
    ""
  );
}

type ScriptItem = {
  source?: string;
  title?: string;
  detail?: string;
  url?: string;
  ts?: string;
};

export async function pullGoogleFeed(): Promise<SyncResult> {
  const base = googleFeedUrl();
  if (!base) {
    return skipped(
      "google-feed",
      "Allow Google with the Apps Script on Control panel.",
    );
  }
  try {
    const token = googleFeedToken();
    const url = token
      ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
      : base;
    const response = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    let payload: { error?: string; items?: ScriptItem[] } = {};
    try {
      payload = JSON.parse(text) as { error?: string; items?: ScriptItem[] };
    } catch {
      throw new Error(
        "Google script did not return JSON. Deploy as a web app, execute as you, access Anyone.",
      );
    }
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `Google script ${response.status}`);
    }
    let added = 0;
    for (const item of payload.items ?? []) {
      const title = item.title?.trim();
      const source = item.source?.trim() || "gmail";
      if (!title) continue;
      if (
        upsertNote({
          source,
          title,
          detail: item.detail,
          url: item.url,
          createdAt: item.ts,
        })
      ) {
        added += 1;
      }
    }
    const detail = added
      ? `Saved ${added} Google ${added === 1 ? "item" : "items"}.`
      : "Google already up to date.";
    logSync("google-feed", true, detail);
    return { channel: "google-feed", ok: true, detail };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Google activity pull failed";
    logSync("google-feed", false, detail);
    return { channel: "google-feed", ok: false, detail };
  }
}
