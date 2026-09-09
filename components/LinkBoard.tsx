"use client";

import { useMemo, useState } from "react";
import type { TrustedLink } from "@/lib/types";
import { Card, Eyebrow, Pill, SearchField } from "./ui";

export function LinkBoard({ links }: { links: TrustedLink[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links.filter(
      (item) =>
        !needle ||
        `${item.label} ${item.area}`.toLowerCase().includes(needle),
    );
  }, [links, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Records
        </p>
        <h1 className="display mt-2 text-4xl">Links</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Drive folders, content trackers and live sites. Completing a linked
          task writes back to Drive when Google is connected. These links remain
          the canonical records to open by hand.
        </p>
      </header>
      <SearchField value={query} onChange={setQuery} placeholder="Search links" />
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((item) => (
          <Card key={item.href}>
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>Trusted</Eyebrow>
              <Pill>{item.area}</Pill>
            </div>
            <h2 className="mt-3 text-lg font-medium">{item.label}</h2>
            <a
              href={item.href}
              className="mt-3 inline-block break-all text-sm text-copper hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
