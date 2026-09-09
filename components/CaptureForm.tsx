"use client";

import { useMemo, useState } from "react";
import { SOURCES, type ActivityEvent, type Project } from "@/lib/types";
import { addLocalEvent } from "@/lib/local";
import { sourceLabel } from "@/lib/format";

export function CaptureForm({
  projects,
  onCreate,
  compact = false,
}: {
  projects: Project[];
  onCreate: (event: ActivityEvent) => void;
  compact?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("manual");
  const [project, setProject] = useState("");
  const sorted = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const created = addLocalEvent({
      source,
      title,
      detail: detail || undefined,
      project: project || undefined,
    });
    onCreate(created);
    setTitle("");
    setDetail("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          What happened
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Shipped, decided, rode, imported from ChatGPT…"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm text-ink placeholder:text-muted"
        />
      </label>
      {compact ? null : (
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Detail
          </span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="Paste a ChatGPT summary or a Cursor / Grok Bot note."
            className="w-full resize-y rounded-xl border border-line bg-white/80 px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Source
          </span>
          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value as (typeof SOURCES)[number])
            }
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
          >
            {SOURCES.map((item) => (
              <option key={item} value={item}>
                {sourceLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Project
          </span>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {sorted.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-moss"
      >
        Log it
      </button>
    </form>
  );
}
