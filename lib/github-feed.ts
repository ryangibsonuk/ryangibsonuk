import { logSync, upsertNote } from "./db";
import type { SyncResult } from "./google";

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

export async function pullGithubActivity(): Promise<SyncResult> {
  const user = githubUser();
  const token = process.env.GITHUB_TOKEN?.trim();
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=30`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "gibson-hq",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub ${response.status}`);
    }
    const events = (await response.json()) as GithubEvent[];
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
    const detail =
      error instanceof Error ? error.message : "GitHub pull failed";
    logSync("github", false, detail);
    return { channel: "github", ok: false, detail };
  }
}
