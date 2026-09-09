"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GOOGLE_ACTIVITY_SCRIPT } from "@/lib/google-script";
import { Card, Eyebrow, Pill } from "./ui";

export function AllowAccess({
  googleScriptUrl,
  googleFeedOn,
  ingestOrigin,
}: {
  googleScriptUrl: string;
  googleFeedOn: boolean;
  ingestOrigin: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(googleScriptUrl);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"script" | "ingest" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const ingestUrl = `${ingestOrigin.replace(/\/$/, "")}/api/ingest`;

  async function copy(label: "script" | "ingest", value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2500);
  }

  async function saveGoogle(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleScriptUrl: url,
          ...(token.trim() ? { googleScriptToken: token } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save");
      const sync = await fetch("/api/sync", { method: "POST" });
      const synced = (await sync.json()) as {
        results?: { channel: string; ok: boolean; detail: string }[];
        error?: string;
      };
      const google = synced.results?.find((item) => item.channel === "google-feed");
      setMessage(google?.detail || "Saved. Open Activity to see the feed.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>Gmail, Drive, Calendar</Eyebrow>
          <Pill>{googleFeedOn ? "Allow done" : "Needs Allow"}</Pill>
        </div>
        <h2 className="display mt-3 text-3xl">Allow Google</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Google will not let a custom website pop a simple Allow screen until
          you own an HTTPS domain and an OAuth client. This is the short path:
          a Google Apps Script that runs as you. You click Allow once in
          Google, then HQ reads Gmail, Drive and Calendar.
        </p>
        <ol className="mt-4 max-w-2xl list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>
            Open{" "}
            <a
              className="text-copper hover:underline"
              href="https://script.google.com/home/projects/create"
              target="_blank"
              rel="noreferrer"
            >
              a new Apps Script
            </a>
            , delete the stub, paste the script, save.
          </li>
          <li>
            Run <code className="rounded bg-paper-2 px-1">collect_</code>. Google
            asks to Allow Gmail, Drive and Calendar. Use your usual account.
          </li>
          <li>
            Deploy → New deployment → type Web app. Execute as Me. Who has
            access: Anyone. Copy the web app URL.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => copy("script", GOOGLE_ACTIVITY_SCRIPT)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            {copied === "script" ? "Copied script" : "Copy script"}
          </button>
        </div>
        <form onSubmit={saveGoogle} className="mt-4 grid gap-3">
          <label className="block max-w-xl">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Web app URL
            </span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://script.google.com/macros/s/…/exec"
              className="w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
            />
          </label>
          <label className="block max-w-xl">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Optional token
            </span>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="If you set HQ_TOKEN in Script properties"
              className="w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="w-fit rounded-full bg-copper px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy ? "Pulling…" : "Save and pull"}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
      </Card>

      <Card>
        <Eyebrow>Cursor, ChatGPT, Grok Bot</Eyebrow>
        <h2 className="display mt-3 text-3xl">They post in</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Those products do not offer a Google-style Allow for a personal
          dashboard. HQ already pulls your public GitHub events (Cursor commits
          show up there). ChatGPT and Grok Bot POST what happened:
        </p>
        <code className="mt-3 block break-all rounded-full bg-paper-2 px-3 py-2 text-xs sm:text-sm">
          {ingestUrl}
        </code>
        <button
          type="button"
          onClick={() => copy("ingest", ingestUrl)}
          className="mt-3 rounded-full border border-line px-3 py-2 text-sm"
        >
          {copied === "ingest" ? "Copied" : "Copy ingest URL"}
        </button>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Header <code className="rounded bg-paper-2 px-1">Authorization: Bearer</code>{" "}
          plus your ingest secret. Body{" "}
          <code className="rounded bg-paper-2 px-1">
            {`{ "source": "chatgpt", "title": "…" }`}
          </code>
          . Sources: chatgpt, cursor, grok-bot.
        </p>
      </Card>
    </div>
  );
}
