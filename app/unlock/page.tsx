"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!response.ok) {
      let message = "That passcode is not right.";
      try {
        const body = (await response.json()) as {
          error?: string;
        };
        if (response.status === 429 && body.error) message = body.error;
        else if (response.status === 503 && body.error) message = body.error;
      } catch {
        if (response.status === 429) {
          message = "Too many attempts. Try again in a few minutes.";
        }
      }
      setError(message);
      setBusy(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
        Gibson HQ
      </p>
      <h1 className="display mt-3 text-4xl">Unlock</h1>
      <p className="mt-3 max-w-sm text-center text-sm leading-6 text-ink-soft">
        Same passcode on your phone and computer. It stays unlocked for 30 days
        on this browser.
      </p>
      <form onSubmit={submit} className="mt-8 w-full max-w-sm">
        <label className="block">
          <span className="mb-2 block text-sm text-ink-soft">Passcode</span>
          <input
            type="password"
            name="passcode"
            autoComplete="current-password"
            enterKeyHint="go"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="w-full rounded-full border border-line bg-white/80 px-4 py-3 text-base"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !pin}
          className="mt-5 w-full rounded-full bg-ink py-3 text-sm font-medium text-paper disabled:opacity-50"
        >
          Open
        </button>
      </form>
    </div>
  );
}
