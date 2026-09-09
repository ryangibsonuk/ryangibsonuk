"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task, TaskActivity, TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import { SearchField } from "./ui";
import { TaskCard } from "./TaskCard";

function matches(query: string, ...values: Array<string | undefined>) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => value?.toLowerCase().includes(needle));
}

export function useLiveTasks(seed: Task[]) {
  const [tasks, setTasks] = useState(seed);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [syncNote, setSyncNote] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/tasks")
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then(
        (payload: { tasks?: Task[]; activity?: TaskActivity[] }) => {
          if (!active) return;
          if (payload.tasks) setTasks(payload.tasks);
          if (payload.activity) setActivity(payload.activity);
        },
      )
      .catch(() => {
        if (active) setError("Live task status is temporarily unavailable.");
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(async (task: Task) => {
    const wasComplete = task.status === "Complete";
    const completed = !wasComplete;
    setError("");
    setSyncNote("");
    setSaving(task.id);
    setTasks((current) =>
      current.map((item) => {
        if (item.id !== task.id) return item;
        if (completed) return { ...item, status: "Complete" };
        const original = seed.find((row) => row.id === task.id);
        return {
          ...item,
          status:
            original?.status && original.status !== "Complete"
              ? original.status
              : "Ready",
        };
      }),
    );
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: task.id, completed, actor: "Ryan" }),
      });
      if (!response.ok) throw new Error("failed");
      const payload = (await response.json()) as {
        activity: TaskActivity;
        state?: { isCompleted: boolean };
        sync?: { channel: string; ok: boolean; detail: string }[];
      };
      setActivity((current) => [payload.activity, ...current]);
      const fails = (payload.sync ?? []).filter((item) => !item.ok);
      const wrote = (payload.sync ?? []).filter(
        (item) =>
          item.ok &&
          !item.detail.startsWith("No ") &&
          !item.detail.startsWith("Skipped"),
      );
      if (fails.length) {
        setSyncNote(fails.map((item) => `${item.channel}: ${item.detail}`).join(" "));
      } else if (wrote.length) {
        setSyncNote(`Also updated ${wrote.map((item) => item.channel).join(", ")}.`);
      }
      const refresh = await fetch("/api/tasks");
      if (refresh.ok) {
        const next = (await refresh.json()) as { tasks?: Task[]; activity?: TaskActivity[] };
        if (next.tasks) setTasks(next.tasks);
        if (next.activity) setActivity(next.activity);
      }
    } catch {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
      setError("That change was not saved. Please try again.");
    } finally {
      setSaving(null);
    }
  }, [seed]);

  return { tasks, activity, saving, error, syncNote, toggle };
}

export function TaskBoard({ seed }: { seed: Task[] }) {
  const { tasks, saving, error, syncNote, toggle } = useLiveTasks(seed);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "All">("All");

  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (filter === "All" || task.status === filter) &&
          matches(query, task.title, task.project, task.status, task.detail),
      ),
    [tasks, filter, query],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Queue
        </p>
        <h1 className="display mt-2 text-4xl">Tasks</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Completions write to HQ first, then to Gmail, Drive and the ChatGPT
          app when those are connected. Assistants share the same store.
        </p>
      </header>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search tasks"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("All")}
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${
            filter === "All" ? "bg-ink text-paper" : "border border-line"
          }`}
        >
          All
        </button>
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${
              filter === status ? "bg-ink text-paper" : "border border-line"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {syncNote ? <p className="text-sm text-ink-soft">{syncNote}</p> : null}
      {visible.length === 0 ? (
        <p className="text-sm text-muted">Nothing in this view matches that search.</p>
      ) : (
        <div className="grid gap-4">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              saving={saving === task.id}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
