"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IntegrationStatus, Project } from "@/lib/types";
import { HqProvider, useHq } from "./HqState";
import { CaptureForm } from "./CaptureForm";
import { GrokChat } from "./GrokChat";
import { Card, Eyebrow } from "./ui";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/decisions", label: "Decisions" },
  { href: "/activity", label: "Activity" },
  { href: "/links", label: "Links" },
  { href: "/teammates", label: "Control panel" },
  { href: "/grok", label: "Grok" },
] as const;

function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Control Centre">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-2 text-sm ${
              active
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-paper-2 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Rail({
  projects,
  status,
}: {
  projects: Project[];
  status: IntegrationStatus;
}) {
  const { addEvent } = useHq();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Eyebrow>Capture</Eyebrow>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          A decision, a Cursor note, a ChatGPT leftover.
        </p>
        <CaptureForm projects={projects} onCreate={addEvent} compact />
      </Card>
      <Card>
        <Eyebrow>Grok</Eyebrow>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          {status.grok
            ? "In-dashboard Grok, briefed on the register."
            : "Needs XAI_API_KEY. Grok Bot can still edit this repo."}
        </p>
        <GrokChat
          grokReady={status.grok}
          model={status.model}
          compact
          onLog={addEvent}
        />
      </Card>
    </div>
  );
}

export function AppShell({
  children,
  projects,
  status,
  showRail = true,
}: {
  children: React.ReactNode;
  projects: Project[];
  status: IntegrationStatus;
  showRail?: boolean;
}) {
  return (
    <HqProvider>
      <div className="grain" aria-hidden />
      <div className="relative mx-auto flex min-h-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="flex flex-col justify-between border-b border-line px-5 py-6 lg:sticky lg:top-0 lg:h-dvh lg:w-56 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
              Wakefield
            </p>
            <Link href="/" className="display mt-1 block text-3xl leading-none">
              Control Centre
            </Link>
            <p className="mt-3 mb-8 max-w-[14rem] text-sm leading-5 text-ink-soft">
              One ledger for projects, tasks, and the assistants that touch them.
            </p>
            <Nav />
          </div>
          <p className="mt-8 hidden text-xs leading-5 text-muted lg:block">
            Git-backed register. SQLite for live task state.
          </p>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</main>
        {showRail ? (
          <aside className="border-t border-line px-5 py-8 lg:sticky lg:top-0 lg:h-dvh lg:w-[340px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-6">
            <Rail projects={projects} status={status} />
          </aside>
        ) : null}
      </div>
    </HqProvider>
  );
}
