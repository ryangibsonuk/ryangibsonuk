import { AppShell } from "@/components/AppShell";
import { GrokBoard } from "@/components/GrokBoard";
import { getProjects } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function GrokPage() {
  const projects = getProjects();
  const status = getIntegrationStatus();
  return (
    <AppShell projects={projects} status={status} showRail={false}>
      <GrokBoard status={status} />
    </AppShell>
  );
}
