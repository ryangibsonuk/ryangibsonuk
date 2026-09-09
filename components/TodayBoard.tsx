"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChangelogEntry, IntegrationStatus, Project, Schedule, Task } from "@/lib/types";
import type { FeedItem } from "@/lib/feed";
import { greeting, sourceLabel } from "@/lib/format";
import { Card, Eyebrow, Pill, SearchField } from "./ui";
import { TaskCard } from "./TaskCard";
import { useLiveTasks } from "./TaskBoard";

function upcoming(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.due && task.status !== "Complete")
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
}

export function TodayBoard({
  projects,
  seedTasks,
  changelog,
  schedules,
  status,
  feed,
}: {
  projects: Project[];
  seedTasks: Task[];
  changelog: ChangelogEntry[];
  schedules: Schedule[];
  status: IntegrationStatus;
  feed: FeedItem[];
}) {
  const { tasks, activity, saving, error, syncNote, toggle } = useLiveTasks(seedTasks);
  const [query, setQuery] = useState("");
  const hello = greeting();

  const needle = query.trim().toLowerCase();
  const match = (...values: Array<string | undefined>) =>
    !needle || values.some((value) => value?.toLowerCase().includes(needle));

  const needsRyan = tasks.filter(
    (task) => task.status === "Needs Ryan" && match(task.title, task.project, task.detail),
  );
  const due = upcoming(tasks).filter((task) =>
    match(task.title, task.due, task.project),
  );
  const complete = tasks.filter((task) => task.status === "Complete").length;
  const activeProjects = projects.filter((project) => project.status === "Active").length;
  const pct = Math.round((complete / Math.max(tasks.length, 1)) * 100);

  const log = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const hit = (...values: Array<string | undefined>) =>
      !needle || values.some((value) => value?.toLowerCase().includes(needle));
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
    }));
    return [...live, ...changelog].filter((entry) =>
      hit(entry.action, entry.project, entry.actor, entry.result),
    );
  }, [activity, changelog, query]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Overview
        </p>
        <h1 className="display mt-2 text-4xl leading-none sm:text-5xl">{hello}</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Recent Gmail, Drive, Calendar, Cursor and assistant events land on
          Activity after you Allow Google on Control panel.
        </p>
      </header>

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search overview"
      />

      <div className="flex flex-wrap gap-2">
        <Pill>{activeProjects} active projects</Pill>
        <Pill>{needsRyan.length} need Ryan</Pill>
        <Pill>
          {complete}/{tasks.length} complete · {pct}%
        </Pill>
        <Pill>Grok {status.grok ? "chat on" : "needs key"}</Pill>
        <Pill>
          Google {status.googleFeed ? "allowed" : status.google ? status.googleEmail || "oauth" : "needs Allow"}
        </Pill>
        <Pill>ChatGPT {status.chatgpt ? "url set" : "ingest"}</Pill>
      </div>

      <Card>
        <Eyebrow>Control panel</Eyebrow>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Allow Google with an Apps Script (one Allow click). Cursor shows up
          from GitHub. ChatGPT and Grok Bot post to the ingest URL.
        </p>
        <Link
          href="/teammates"
          className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Allow access
        </Link>
      </Card>

      <Card>
        <Eyebrow>Latest</Eyebrow>
        {feed.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Empty until Google is Allowed and you hit Refresh on Activity.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {feed.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {sourceLabel(entry.source)}
                </p>
                <p className="mt-1 text-sm font-medium">{entry.title}</p>
              </li>
            ))}
          </ol>
        )}
        <Link
          href="/activity"
          className="mt-4 inline-flex text-sm text-copper hover:underline"
        >
          Open activity
        </Link>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {syncNote ? <p className="text-sm text-ink-soft">{syncNote}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Eyebrow>Needs Ryan</Eyebrow>
          <div className="mt-4 grid gap-4">
            {needsRyan.length === 0 ? (
              <p className="text-sm text-muted">Nothing waiting on you.</p>
            ) : (
              needsRyan.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  saving={saving === task.id}
                  onToggle={toggle}
                />
              ))
            )}
          </div>
        </Card>
        <Card>
          <Eyebrow>Upcoming dates</Eyebrow>
          <ul className="mt-4 space-y-3">
            {due.length === 0 ? (
              <li className="text-sm text-muted">No dated items in the open queue.</li>
            ) : (
              due.map((task) => (
                <li key={task.id}>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-sm text-ink-soft">
                    {task.due} · {task.project}
                  </p>
                </li>
              ))
            )}
          </ul>
          <Eyebrow>Recurring content</Eyebrow>
          <ul className="mt-4 space-y-3">
            {schedules
              .filter((item) => match(item.title, item.project, item.cadence))
              .map((item) => (
                <li key={item.id}>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-ink-soft">
                    {item.cadence} · {item.project}
                  </p>
                </li>
              ))}
          </ul>
        </Card>
      </div>

      <Card>
        <Eyebrow>Change log</Eyebrow>
        <ol className="mt-4 divide-y divide-line">
          {log.slice(0, 10).map((entry, index) => (
            <li key={`${entry.action}-${index}`} className="py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {entry.date} · {entry.actor} · {entry.project}
              </p>
              <p className="mt-1 text-sm font-medium">{entry.action}</p>
              <p className="text-sm leading-6 text-ink-soft">{entry.result}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
