"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectGrid } from "@/components/ProjectGrid";
import { SearchField } from "@/components/ui";

export function ProjectBoard({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter(
      (project) =>
        !needle ||
        `${project.name} ${project.area} ${project.summary} ${project.next}`
          .toLowerCase()
          .includes(needle),
    );
  }, [projects, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Portfolio
        </p>
        <h1 className="display mt-2 text-4xl">Projects</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Thirteen live lines of work from the Control Centre register, including
          retained clients. FamilyCycling stays parked.
        </p>
      </header>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search projects"
      />
      {visible.length === 0 ? (
        <p className="text-sm text-muted">Nothing in this view matches that search.</p>
      ) : (
        <ProjectGrid projects={visible} />
      )}
    </div>
  );
}
