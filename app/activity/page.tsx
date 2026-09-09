import { ActivityBoard } from "@/components/ActivityBoard";
import { AppShell } from "@/components/AppShell";
import { getChangelog, getProjects, getSeedTasks } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function ActivityPage() {
  const projects = getProjects();
  return (
    <AppShell projects={projects} status={getIntegrationStatus()}>
      <ActivityBoard changelog={getChangelog()} seedTasks={getSeedTasks()} />
    </AppShell>
  );
}
