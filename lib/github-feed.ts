import { setDefaultResultOrder } from "node:dns";
import { logSync, upsertNote } from "./db";
import { githubErrorDetail, githubShouldRetry } from "./github-error";
import type { SyncResult } from "./sync-result";

try {
  setDefaultResultOrder("ipv4first");
} catch {
  // Older Node or restricted DNS; fetch still proceeds.
}

type GithubEvent = {
  type?: string;
  created_at?: string;
  repo?: { name?: string };
  actor?: { login?: string };
  payload?: {
    size?: number;
    ref?: string;
    action?: string;
    commits?: { message?: string }[];
    pull_request?: { title?: string; html_url?: string };
    issue?: { title?: string; html_url?: string };
  };
};

function githubUser(): string {
  return process.env.GITHUB_USERNAME?.trim() || "ryangibsonuk";
}

function eventTitle(event: GithubEvent): string {
  const repo = event.repo?.name || "GitHub";
  const type = event.type || "Event";
  if (type === "PushEvent") {
    const n = event.payload?.size || event.payload?.commits?.length || 0;
    const msg = event.payload?.commits?.[0]?.message?.split("\n")[0];
    if (msg) return `Cursor/GitHub: ${msg}`;
    return `Pushed ${n} ${n === 1 ? "commit" : "commits"} to ${repo}`;
  }
  if (type === "PullRequestEvent") {
    return event.payload?.pull_request?.title
      ? `PR: ${event.payload.pull_request.title}`
      : `Pull request on ${repo}`;
  }
  if (type === "IssuesEvent") {
    return event.payload?.issue?.title
      ? `Issue: ${event.payload.issue.title}`
      : `Issue on ${repo}`;
  }
  return `${type.replace(/Event$/, "")} on ${repo}`;
}

function eventUrl(event: GithubEvent): string | undefined {
  return (
    event.payload?.pull_request?.html_url ||
    event.payload?.issue?.html_url ||
    (event.repo?.name
      ? `https://github.com/${event.repo.name}`
      : undefined)
  );
}

async function fetchGithubEvents(user: string, token?: string): Promise<GithubEvent[]> {
  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=30`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "Gibson-HQ (ryangibsonuk)",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!response.ok) {
        throw new Error(`GitHub ${response.status}`);
      }
      return (await response.json()) as GithubEvent[];
    } catch (error) {
      last = error;
      if (!githubShouldRetry(error) || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw last instanceof Error ? last : new Error("GitHub pull failed");
}

export async function pullGithubActivity(): Promise<SyncResult> {
  const user = githubUser();
  const token = process.env.GITHUB_TOKEN?.trim();
  try {
    const events = await fetchGithubEvents(user, token);
    let added = 0;
    for (const event of events) {
      const title = eventTitle(event);
      if (
        upsertNote({
          source: event.type === "PushEvent" ? "cursor" : "github",
          title,
          detail: event.actor?.login ? `by ${event.actor.login}` : undefined,
          url: eventUrl(event),
          createdAt: event.created_at,
        })
      ) {
        added += 1;
      }
    }
    const detail = added
      ? `Saved ${added} GitHub/Cursor ${added === 1 ? "event" : "events"}.`
      : "GitHub already up to date.";
    logSync("github", true, detail);
    return { channel: "github", ok: true, detail };
  } catch (error) {
    const detail = githubErrorDetail(error);
    logSync("github", false, detail);
    return { channel: "github", ok: false, detail };
  }
}
