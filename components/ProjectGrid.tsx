import type { Project } from "@/lib/types";
import { Card, Pill, ProjectStatusPill } from "./ui";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Card key={project.id} className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Pill>{project.area}</Pill>
            <ProjectStatusPill status={project.status} />
          </div>
          <h2 className="display mt-3 text-2xl leading-tight">{project.name}</h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-ink-soft">
            {project.summary}
          </p>
          <p className="mt-4 text-sm leading-6">
            <span className="font-medium">Next: </span>
            {project.next}
          </p>
          {project.links.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-copper hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
