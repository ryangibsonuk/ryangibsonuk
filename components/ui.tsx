import type { ActivitySource, ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";
import { sourceLabel } from "@/lib/format";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white/55 p-5 shadow-[0_1px_0_rgba(27,33,24,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line bg-paper px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft ${className}`}
    >
      {children}
    </span>
  );
}

export function SourcePill({ source }: { source: ActivitySource | string }) {
  return <Pill>{sourceLabel(source)}</Pill>;
}

const PROJECT_TONE: Record<ProjectStatus, string> = {
  Active: "bg-moss text-paper",
  Monitor: "bg-ink text-paper",
  Parked: "bg-paper-2 text-muted",
};

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${PROJECT_TONE[status]}`}
    >
      {status}
    </span>
  );
}

const TASK_TONE: Record<TaskStatus, string> = {
  "Needs Ryan": "bg-danger text-paper",
  Ready: "bg-ink text-paper",
  Waiting: "bg-copper text-paper",
  Scheduled: "bg-moss-2 text-paper",
  Complete: "bg-sage text-ink",
  Parked: "bg-paper-2 text-muted",
};

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${TASK_TONE[status]}`}
    >
      {status}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return <Pill>{priority}</Pill>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
      {children}
    </p>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
    />
  );
}
