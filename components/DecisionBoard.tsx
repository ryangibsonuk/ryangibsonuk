"use client";

import { useMemo, useState } from "react";
import type { Decision } from "@/lib/types";
import { Card, Eyebrow, Pill, SearchField } from "./ui";

export function DecisionBoard({ decisions }: { decisions: Decision[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return decisions.filter(
      (item) =>
        !needle ||
        `${item.title} ${item.project} ${item.detail} ${item.state}`
          .toLowerCase()
          .includes(needle),
    );
  }, [decisions, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Standing rules
        </p>
        <h1 className="display mt-2 text-4xl">Decisions</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Andrew and Carl stay parked. Inbox stays quiet on purpose. Family
          time is protected.
        </p>
      </header>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search decisions"
      />
      <div className="grid gap-4">
        {visible.map((item) => (
          <Card key={`${item.date}-${item.title}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>{item.date}</Eyebrow>
              <Pill>{item.state}</Pill>
            </div>
            <h2 className="display mt-3 text-2xl">{item.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
              {item.project}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{item.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
