import { AppShell } from "@/components/AppShell";
import { LinkBoard } from "@/components/LinkBoard";
import { getLinks, getProjects } from "@/lib/data";
import { getIntegrationStatus } from "@/lib/status";

export default function LinksPage() {
  const projects = getProjects();
  return (
    <AppShell projects={projects} status={getIntegrationStatus()}>
      <LinkBoard links={getLinks()} />
    </AppShell>
  );
}
