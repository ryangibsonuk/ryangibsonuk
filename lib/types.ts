export const TASK_STATUSES = [
  "Needs Ryan",
  "Ready",
  "Waiting",
  "Scheduled",
  "Complete",
  "Parked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = "High" | "Medium" | "Low";
export type ProjectStatus = "Active" | "Monitor" | "Parked";
export type Actor = "Ryan" | "ChatGPT" | "Cursor" | "Grok";

export const ASSISTANT_ACTORS = ["ChatGPT", "Cursor", "Grok"] as const;

export type ProjectLink = { label: string; href: string };

export type Project = {
  id: string;
  name: string;
  area: string;
  status: ProjectStatus;
  summary: string;
  next: string;
  accent: string;
  links: ProjectLink[];
};

export type Task = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  detail: string;
  href?: string;
  due?: string;
};

export type Decision = {
  date: string;
  project: string;
  title: string;
  detail: string;
  state: string;
};

export type ChangelogEntry = {
  date: string;
  project: string;
  action: string;
  actor: string;
  result: string;
  href?: string;
};

export type TrustedLink = {
  label: string;
  area: string;
  href: string;
};

export type Schedule = {
  id: string;
  title: string;
  project: string;
  cadence: string;
  status: string;
  href?: string | null;
};

export type TaskState = {
  taskId: string;
  isCompleted: boolean;
  completedAt: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type TaskActivity = {
  id?: number;
  taskId: string;
  action: string;
  project: string;
  result: string;
  actor: string;
  createdAt: string;
};

export type IntegrationStatus = {
  grok: boolean;
  ingest: boolean;
  github: boolean;
  pin: boolean;
  apiKey: boolean;
  model: string;
  githubUser: string;
};

export const SOURCES = [
  "chatgpt",
  "cursor",
  "grok",
  "grok-bot",
  "github",
  "life",
  "manual",
] as const;

export type ActivitySource = (typeof SOURCES)[number];

export function isSource(value: string): value is ActivitySource {
  return (SOURCES as readonly string[]).includes(value);
}

export type ActivityEvent = {
  id: string;
  ts: string;
  source: ActivitySource;
  project?: string;
  title: string;
  detail?: string;
  url?: string;
  tags?: string[];
};
