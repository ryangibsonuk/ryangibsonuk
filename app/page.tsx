import { AppShell } from "@/components/AppShell";
import { TodayBoard } from "@/components/TodayBoard";
import {
  getChangelog,
  getProjects,
  getSchedules,
  getSeedTasks,
} from "@/lib/data";
import { buildFeed } from "@/lib/feed";
import { getIntegrationStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const projects = getProjects();
  const status = getIntegrationStatus();
  return (
    <AppShell projects={projects} status={status}>
      <TodayBoard
        projects={projects}
        seedTasks={getSeedTasks()}
        changelog={getChangelog()}
        schedules={getSchedules()}
        status={status}
        feed={buildFeed(8)}
      />
    </AppShell>
  );
}
