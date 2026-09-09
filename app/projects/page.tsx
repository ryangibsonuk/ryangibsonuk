import { AppShell } from "@/components/AppShell";
import { ProjectBoard } from "@/components/ProjectBoard";
import { getProjects } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <AppShell projects={projects} status={getIntegrationStatus()}>
      <ProjectBoard projects={projects} />
    </AppShell>
  );
}
