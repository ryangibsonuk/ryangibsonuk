"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Eyebrow, Pill } from "./ui";

type SyncLogEntry = {
  channel: string;
  ok: boolean;
  detail: string;
  createdAt: string;
};

export function Connections({
  googleConfigured,
  googleConnected,
  googleEmail,
  chatgptConfigured,
  chatgptUrl,
  log,
  googleResult,
}: {
  googleConfigured: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
  chatgptConfigured: boolean;
  chatgptUrl: string | null;
  log: SyncLogEntry[];
  googleResult?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    googleResult === "connected"
      ? "Google connected. Completing a task will now label Gmail and write Drive."
      : googleResult === "error"
        ? "Google connect failed. Check the OAuth client redirect URI and try again."
        : null,
  );
  const [entries, setEntries] = useState(log);
  const [chatgptOrigin, setChatgptOrigin] = useState(chatgptUrl ?? "");
  const [chatgptReady, setChatgptReady] = useState(chatgptConfigured);

  async function syncNow() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as {
        applied?: { taskId: string; source: string }[];
        results?: { channel: string; ok: boolean; detail: string }[];
        log?: SyncLogEntry[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Sync failed");
      const applied = payload.applied?.length ?? 0;
      const fails = (payload.results ?? []).filter((item) => !item.ok);
      setMessage(
        applied
          ? `Updated ${applied} task${applied === 1 ? "" : "s"} from Gmail, Drive or ChatGPT.`
          : fails.length
            ? fails.map((item) => `${item.channel}: ${item.detail}`).join(" ")
            : "Nothing new to pull. Outbound writes still run when you complete a task.",
      );
      if (payload.log) setEntries(payload.log);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveChatgptUrl(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatgptAppUrl: chatgptOrigin }),
      });
      const payload = (await response.json()) as {
        error?: string;
        chatgpt?: { configured: boolean; url: string | null };
      };
      if (!response.ok) throw new Error(payload.error || "Could not save URL");
      setChatgptReady(Boolean(payload.chatgpt?.configured));
      setChatgptOrigin(payload.chatgpt?.url || "");
      setMessage(
        payload.chatgpt?.url
          ? "ChatGPT app URL saved. Completing a task will push there."
          : "ChatGPT app URL cleared.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save URL");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    router.push("/teammates");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>Gmail and Drive</Eyebrow>
          <Pill>
            {googleConnected
              ? googleEmail || "Connected"
              : googleConfigured
                ? "Needs connect"
                : "Needs OAuth client"}
          </Pill>
        </div>
        <h2 className="display mt-3 text-3xl">Google</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Completing a Gmail-linked task marks the thread read and adds HQ and
          HQ/Complete. Completing a Drive-folder task upserts{" "}
          <code className="rounded bg-paper-2 px-1">hq-task-*.json</code> in that
          folder. Completing a spreadsheet-linked task writes a Gibson HQ tab on
          that sheet. Every tick also appends a row to a Drive sheet named
          Gibson HQ Sync. Pull reads labels, folder files and those tabs back
          into HQ.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {googleConfigured && !googleConnected ? (
            <a
              href="/api/auth/google"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
            >
              Connect Google
            </a>
          ) : null}
          {googleConnected ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="rounded-full border border-line px-4 py-2 text-sm"
            >
              Disconnect
            </button>
          ) : null}
        </div>
        {!googleConfigured ? (
          <p className="mt-3 text-sm text-muted">
            Create a Google Cloud OAuth client, enable Gmail, Drive and Sheets
            APIs, add yourself as a test user, set the redirect to{" "}
            {`{origin}/api/auth/google/callback`}, then set GOOGLE_CLIENT_ID and
            GOOGLE_CLIENT_SECRET.
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>Published Control Centre</Eyebrow>
          <Pill>{chatgptReady ? "URL set" : "Needs app URL"}</Pill>
        </div>
        <h2 className="display mt-3 text-3xl">ChatGPT</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          HQ pushes each complete/reopen to the published app{" "}
          <code className="rounded bg-paper-2 px-1">/api/integrations/tasks</code>
          . That app can POST the same path here with actor ChatGPT. Sync now
          pulls its D1 states. Paste the published origin below, or set
          CHATGPT_APP_URL. Use CHATGPT_APP_KEY if it uses a different secret.
        </p>
        <form onSubmit={saveChatgptUrl} className="mt-4 flex flex-wrap gap-3">
          <input
            type="url"
            value={chatgptOrigin}
            onChange={(event) => setChatgptOrigin(event.target.value)}
            placeholder="https://your-control-centre.example"
            className="min-w-[16rem] flex-1 rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
          >
            Save URL
          </button>
        </form>
      </Card>

      <Card>
        <Eyebrow>Pull now</Eyebrow>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Read Gmail labels, Drive status files and the ChatGPT app, then update
          HQ. Completing a task here already pushes the other way.
        </p>
        <button
          type="button"
          onClick={syncNow}
          disabled={busy}
          className="mt-4 rounded-full bg-copper px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
        >
          {busy ? "Syncing…" : "Sync now"}
        </button>
        {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
        {entries.length > 0 ? (
          <ol className="mt-4 divide-y divide-line text-sm">
            {entries.slice(0, 8).map((entry) => (
              <li key={`${entry.createdAt}-${entry.detail}`} className="py-2">
                <span className="uppercase tracking-[0.14em] text-muted">
                  {entry.channel}
                </span>{" "}
                {entry.ok ? "ok" : "failed"} · {entry.detail}
              </li>
            ))}
          </ol>
        ) : null}
      </Card>
    </div>
  );
}
