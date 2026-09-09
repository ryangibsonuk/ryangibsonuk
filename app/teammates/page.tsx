import { AppShell } from "@/components/AppShell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { getProjects } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function TeammatesPage() {
  const projects = getProjects();
  const status = getIntegrationStatus();

  const mates = [
    {
      name: "ChatGPT",
      role: "Where the Control Centre started",
      state: "Import + API",
      body: "The published Control Centre is a seeded ChatGPT app. HQ now holds the same register in git. ChatGPT can read and complete tasks through POST /api/integrations/tasks with actor ChatGPT.",
    },
    {
      name: "Cursor",
      role: "Builder in this repo",
      state: status.apiKey ? "Key set" : "Git + API",
      body: "Cloud Agents work in this repository. Completions from the UI write to SQLite. Cursor can also POST as actor Cursor using CONTROL_CENTRE_API_KEY.",
    },
    {
      name: "Grok Bot",
      role: "Persistent teammate",
      state: "Connect repo",
      body: "Point Grok Bot at this repository and AGENTS.md. It can edit data/*.json, run the app, and call the MCP endpoint.",
    },
    {
      name: "Grok in HQ",
      role: "Chat inside the dashboard",
      state: status.grok ? `Live · ${status.model}` : "Needs XAI_API_KEY",
      body: "The right-hand panel talks to xAI. It already knows the register. Save replies into Activity when they are worth keeping.",
    },
  ];

  return (
    <AppShell projects={projects} status={status}>
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Connect
        </p>
        <h1 className="display mt-2 text-4xl">Teammates</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Task ticks in this app are stored here. They are not yet synced with
          Gmail or Drive. Assistants share the same SQLite store.
        </p>
      </header>
      <div className="grid gap-4">
        {mates.map((mate) => (
          <Card key={mate.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>{mate.role}</Eyebrow>
              <Pill>{mate.state}</Pill>
            </div>
            <h2 className="display mt-3 text-3xl">{mate.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
              {mate.body}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <Eyebrow>Assistant API</Eyebrow>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Header <code className="rounded bg-paper-2 px-1">x-control-centre-key</code>{" "}
          plus actor ChatGPT, Cursor or Grok.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-6 text-paper">
          {`curl -X POST http://localhost:3000/api/integrations/tasks \\
  -H "x-control-centre-key: $CONTROL_CENTRE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"taskId":"namecheap","completed":true,"actor":"Cursor","result":"Backups restored"}'

curl -X POST http://localhost:3000/api/mcp \\
  -H "x-control-centre-key: $CONTROL_CENTRE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"method":"list_tasks"}'`}
        </pre>
      </Card>
    </AppShell>
  );
}
