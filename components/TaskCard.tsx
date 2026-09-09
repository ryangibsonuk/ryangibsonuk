"use client";

import type { Task } from "@/lib/types";
import { PriorityPill, TaskStatusPill } from "./ui";

export function TaskCard({
  task,
  saving,
  onToggle,
}: {
  task: Task;
  saving?: boolean;
  onToggle: (task: Task) => void;
}) {
  const complete = task.status === "Complete";
  return (
    <article className="rounded-2xl border border-line bg-white/55 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusPill status={task.status} />
        <PriorityPill priority={task.priority} />
        {task.due ? (
          <span className="text-xs text-muted">Due {task.due}</span>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-medium leading-6">{task.title}</h3>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
        {task.project}
      </p>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{task.detail}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => onToggle(task)}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            complete
              ? "border border-line hover:bg-paper-2"
              : "bg-ink text-paper hover:bg-moss"
          } disabled:opacity-50`}
        >
          {saving ? "Saving…" : complete ? "Reopen" : "Mark complete"}
        </button>
        {task.href ? (
          <a
            href={task.href}
            className="text-sm text-copper hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Open record
          </a>
        ) : null}
      </div>
    </article>
  );
}
