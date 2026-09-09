import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ChangelogEntry,
  Decision,
  Project,
  Schedule,
  Task,
  TrustedLink,
} from "./types";

const dataDir = join(process.cwd(), "data");

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;
}

export function getProjects(): Project[] {
  return readJson<Project[]>("projects.json");
}

export function getSeedTasks(): Task[] {
  return readJson<Task[]>("tasks.json");
}

export function getDecisions(): Decision[] {
  return readJson<Decision[]>("decisions.json");
}

export function getChangelog(): ChangelogEntry[] {
  return readJson<ChangelogEntry[]>("changelog.json");
}

export function getLinks(): TrustedLink[] {
  return readJson<TrustedLink[]>("links.json");
}

export function getSchedules(): Schedule[] {
  return readJson<Schedule[]>("schedules.json");
}

export function findTask(id: string): Task | undefined {
  return getSeedTasks().find((task) => task.id === id);
}

export function findProject(idOrName: string): Project | undefined {
  return getProjects().find(
    (project) => project.id === idOrName || project.name === idOrName,
  );
}
