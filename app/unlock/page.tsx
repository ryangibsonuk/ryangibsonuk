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
      setError("That PIN is not right.");
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
      <form onSubmit={submit} className="mt-8 w-full max-w-sm">
        <label className="block">
          <span className="mb-2 block text-sm text-ink-soft">PIN</span>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="w-full rounded-full border border-line bg-white/80 px-4 py-3"
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
