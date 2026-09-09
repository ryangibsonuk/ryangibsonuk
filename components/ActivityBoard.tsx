"use client";

import { useMemo, useState } from "react";
import type { ChangelogEntry } from "@/lib/types";
import { Card, Eyebrow, SearchField } from "./ui";
import { useLiveTasks } from "./TaskBoard";
import type { Task } from "@/lib/types";

export function ActivityBoard({
  changelog,
  seedTasks,
}: {
  changelog: ChangelogEntry[];
  seedTasks: Task[];
}) {
  const { activity } = useLiveTasks(seedTasks);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const live = activity.map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      project: entry.project,
      action: entry.action,
      actor: entry.actor,
      result: entry.result,
      href: undefined as string | undefined,
    }));
    const needle = query.trim().toLowerCase();
    return [...live, ...changelog].filter(
      (entry) =>
        !needle ||
        [entry.action, entry.project, entry.actor, entry.result]
          .join(" ")
          .toLowerCase()
          .includes(needle),
    );
  }, [activity, changelog, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Ledger
        </p>
        <h1 className="display mt-2 text-4xl">Activity</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Seeded change log plus every task toggle from this dashboard or a
          connected assistant.
        </p>
      </header>
      <SearchField value={query} onChange={setQuery} placeholder="Search activity" />
      <Card>
        <Eyebrow>
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </Eyebrow>
        <ol className="mt-4 divide-y divide-line">
          {rows.map((entry, index) => (
            <li key={`${entry.action}-${index}`} className="py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {entry.date} · {entry.actor} · {entry.project}
              </p>
              <p className="mt-1 text-base font-medium">{entry.action}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{entry.result}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
