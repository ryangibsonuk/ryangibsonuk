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
  googleClientId,
  chatgptConfigured,
  chatgptUrl,
  callbackUrl,
  log,
  googleResult,
}: {
  googleConfigured: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
  googleClientId: string;
  chatgptConfigured: boolean;
  chatgptUrl: string | null;
  callbackUrl: string;
  log: SyncLogEntry[];
  googleResult?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const [clientId, setClientId] = useState(googleClientId);
  const [clientSecret, setClientSecret] = useState("");
  const [googleReady, setGoogleReady] = useState(googleConfigured);
  const [googleOn, setGoogleOn] = useState(googleConnected);

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

  async function saveGoogle(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const body: { googleClientId: string; googleClientSecret?: string } = {
        googleClientId: clientId,
      };
      if (clientSecret.trim()) body.googleClientSecret = clientSecret.trim();
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        error?: string;
        google?: { configured: boolean; connected: boolean; email: string | null };
      };
      if (!response.ok) throw new Error(payload.error || "Could not save Google client");
      setGoogleReady(Boolean(payload.google?.configured));
      setGoogleOn(Boolean(payload.google?.connected));
      setClientSecret("");
      setMessage(
        !clientId.trim()
          ? "Google client cleared."
          : payload.google?.configured
            ? "Google client saved. Click Connect Google to sign in."
            : "Client ID saved. Add the client secret too before Connect Google appears.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Google client");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    setGoogleOn(false);
    router.push("/teammates");
    router.refresh();
  }

  async function copyCallback() {
    setMessage(`Redirect URI: ${callbackUrl}`);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(callbackUrl);
      } else {
        throw new Error("clipboard unavailable");
      }
    } catch {
      const input = document.createElement("textarea");
      input.value = callbackUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>Gmail and Drive</Eyebrow>
          <Pill>
            {googleOn
              ? googleEmail || "Connected"
              : googleReady
                ? "Needs connect"
                : "Needs OAuth client"}
          </Pill>
        </div>
        <h2 className="display mt-3 text-3xl">Google</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Completing a Gmail-linked task marks the thread read and adds HQ and
          HQ/Complete. Folder tasks upsert a status file. Spreadsheet tasks
          write a Gibson HQ tab. Sync now reads those back.
        </p>
        <ol className="mt-4 max-w-2xl list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>
            Open{" "}
            <a
              className="text-copper hover:underline"
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud credentials
            </a>
            . Create a project if you do not have one.
          </li>
          <li>
            Enable Gmail API, Google Drive API and Google Sheets API for that
            project.
          </li>
          <li>
            Create an OAuth client of type Web application. Add this exact
            redirect URI:
          </li>
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-full bg-paper-2 px-3 py-2 text-xs sm:text-sm">
            {callbackUrl}
          </code>
          <button
            type="button"
            onClick={copyCallback}
            className="rounded-full border border-line px-3 py-2 text-sm"
          >
            {copied ? "Copied" : "Copy URI"}
          </button>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Under OAuth consent screen, add your Google account as a test user.
          Then paste the client ID and secret here.
        </p>
        <form onSubmit={saveGoogle} className="mt-4 grid gap-3">
          <label className="block max-w-xl">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Client ID
            </span>
            <input
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              autoComplete="off"
              className="w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
            />
          </label>
          <label className="block max-w-xl">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Client secret
            </span>
            <input
              type="password"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder={googleReady ? "Saved in HQ. Leave blank to keep." : ""}
              autoComplete="new-password"
              className="w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
            >
              Save Google client
            </button>
            {googleReady && !googleOn ? (
              <a
                href="/api/auth/google"
                className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-paper"
              >
                Connect Google
              </a>
            ) : null}
            {googleOn ? (
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
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>Published Control Centre</Eyebrow>
          <Pill>{chatgptReady ? "URL set" : "Needs app URL"}</Pill>
        </div>
        <h2 className="display mt-3 text-3xl">ChatGPT</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Paste the origin of the published vinext app (the site you got from
          ChatGPT when it shipped Ryan Control Centre), not a chatgpt.com chat
          URL. HQ will POST{" "}
          <code className="rounded bg-paper-2 px-1">/api/integrations/tasks</code>{" "}
          there. Sync now pulls the other way. The same API key as HQ unless you
          set CHATGPT_APP_KEY.
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
