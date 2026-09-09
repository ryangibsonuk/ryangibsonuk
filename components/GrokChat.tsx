"use client";

import { useEffect, useState } from "react";
import type { ActivityEvent } from "@/lib/types";
import { addLocalEvent, loadGrokChat, saveGrokChat, type StoredChat } from "@/lib/local";

export function GrokChat({
  grokReady,
  model,
  compact = false,
  onLog,
}: {
  grokReady: boolean;
  model: string;
  compact?: boolean;
  onLog?: (event: ActivityEvent) => void;
}) {
  const [messages, setMessages] = useState<StoredChat[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setMessages(loadGrokChat());
  }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !payload.text) {
        throw new Error(payload.error || "Grok did not reply");
      }
      const withReply = [...next, { role: "assistant" as const, content: payload.text }];
      setMessages(withReply);
      saveGrokChat(withReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grok failed");
      saveGrokChat(next);
    } finally {
      setBusy(false);
    }
  }

  function logLast() {
    const last = [...messages].reverse().find((message) => message.role === "assistant");
    if (!last) return;
    const event = addLocalEvent({
      source: "grok",
      title: "Grok note from HQ chat",
      detail: last.content.slice(0, 1200),
      project: "gibson-hq",
      tags: ["grok"],
    });
    onLog?.(event);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto ${compact ? "max-h-64" : "max-h-[28rem]"}`}
      >
        {messages.length === 0 ? (
          <p className="text-sm leading-6 text-ink-soft">
            {grokReady
              ? "Ask Grok what to do next, or drop in a ChatGPT leftover to turn into a log entry."
              : "Add XAI_API_KEY to .env.local to talk to Grok here. Grok Bot can still work in this repo without it."}
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-6 rounded-2xl bg-ink px-3 py-2 text-sm leading-6 text-paper"
                  : "mr-4 rounded-2xl bg-paper-2 px-3 py-2 text-sm leading-6 text-ink"
              }
            >
              {message.content}
            </div>
          ))
        )}
        {busy ? <p className="text-xs uppercase tracking-[0.16em] text-muted">Grok is writing…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
      <form onSubmit={send} className="mt-3 flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={compact ? 2 : 4}
          placeholder={grokReady ? "Message Grok…" : "Key missing — you can still type, it will fail until XAI_API_KEY is set"}
          className="w-full resize-y rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-paper hover:bg-copper-2 disabled:opacity-50"
          >
            Send
          </button>
          {messages.some((message) => message.role === "assistant") ? (
            <button
              type="button"
              onClick={logLast}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2"
            >
              Save last reply to activity
            </button>
          ) : null}
        </div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
          Model {model}
        </p>
      </form>
    </div>
  );
}
