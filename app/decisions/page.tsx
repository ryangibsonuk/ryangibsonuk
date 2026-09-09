import { AppShell } from "@/components/AppShell";
import { DecisionBoard } from "@/components/DecisionBoard";
import { getDecisions, getProjects } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default function DecisionsPage() {
  const projects = getProjects();
  return (
    <AppShell projects={projects} status={getIntegrationStatus()}>
      <DecisionBoard decisions={getDecisions()} />
    </AppShell>
  );
}
