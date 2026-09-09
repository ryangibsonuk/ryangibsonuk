import { AppShell } from "@/components/AppShell";
import { Connections } from "@/components/Connections";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { chatgptStatus } from "@/lib/chatgpt";
import { getProjects } from "@/lib/data";
import { listSyncLog } from "@/lib/db";
import { googleClient } from "@/lib/google";
import { googleCallbackUrl, publicOrigin } from "@/lib/origin";
import { getIntegrationStatus } from "@/lib/status";

export default async function TeammatesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const projects = getProjects();
  const status = getIntegrationStatus();
  const chatgpt = chatgptStatus();
  const params = await searchParams;
  const callbackUrl = googleCallbackUrl(await publicOrigin());

  const mates = [
    {
      name: "ChatGPT",
      role: "Published Control Centre",
      state: status.chatgpt ? "Two-way URL set" : "Needs app URL",
      body: "The ChatGPT app can POST here as actor ChatGPT. HQ pushes the same updates back when the app origin is saved, and Sync now pulls its D1 states.",
    },
    {
      name: "Cursor",
      role: "Builder in this repo",
      state: status.apiKey ? "Key set" : "Git + API",
      body: "Cloud Agents work in this repository. Completions write to SQLite and fan out to Gmail, Drive and ChatGPT.",
    },
    {
      name: "Grok Bot",
      role: "Persistent teammate",
      state: "Connect repo",
      body: "Point Grok Bot at this repository and AGENTS.md. It can call the MCP endpoint as actor Grok.",
    },
    {
      name: "Grok in HQ",
      role: "Chat inside the dashboard",
      state: status.grok ? `Live · ${status.model}` : "Needs XAI_API_KEY",
      body: "The right-hand panel talks to xAI. Completing a task from HQ still syncs Google and ChatGPT.",
    },
  ];

  return (
    <AppShell projects={projects} status={status}>
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Connect
        </p>
        <h1 className="display mt-2 text-4xl">Control panel</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          This is the page for Gmail, Drive and ChatGPT. Paste Google OAuth
          details and the published ChatGPT origin here, then Connect Google.
          Unlock with your passcode. Assistants use the API key, not the
          passcode.
        </p>
      </header>
      <div className="mb-4 grid gap-4">
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
      <Connections
        googleConfigured={status.googleConfigured}
        googleConnected={status.google}
        googleEmail={status.googleEmail}
        googleClientId={googleClient().clientId}
        chatgptConfigured={status.chatgpt}
        chatgptUrl={chatgpt.url}
        callbackUrl={callbackUrl}
        log={listSyncLog(15)}
        googleResult={params.google}
      />
    </AppShell>
  );
}
