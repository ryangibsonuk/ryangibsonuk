import { AppShell } from "@/components/AppShell";
import { TaskBoard } from "@/components/TaskBoard";
import { getProjects, getSeedTasks } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function TasksPage() {
  const projects = getProjects();
  return (
    <AppShell projects={projects} status={getIntegrationStatus()}>
      <TaskBoard seed={getSeedTasks()} />
    </AppShell>
  );
}
