import { ActivityBoard } from "@/components/ActivityBoard";
import { AppShell } from "@/components/AppShell";
import { getProjects } from "@/lib/data";
import { buildFeed } from "@/lib/feed";
import { getIntegrationStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  const projects = getProjects();
  const status = getIntegrationStatus();
  return (
    <AppShell projects={projects} status={status}>
      <ActivityBoard initial={buildFeed(100)} googleFeed={status.googleFeed} />
    </AppShell>
  );
}
