import type { IntegrationStatus } from "./types";
import { grokConfig } from "./grok";

export function getIntegrationStatus(): IntegrationStatus {
  const { configured, model } = grokConfig();
  return {
    grok: configured,
    ingest: Boolean(process.env.INGEST_SECRET?.trim()),
    github: Boolean(process.env.GITHUB_TOKEN?.trim()),
    pin: Boolean(process.env.DASHBOARD_PIN?.trim()),
    apiKey: Boolean(process.env.CONTROL_CENTRE_API_KEY?.trim()),
    model,
    githubUser: process.env.GITHUB_USERNAME?.trim() || "ryangibsonuk",
  };
}

export function integrationKeyOk(request: Request): boolean {
  const expected = process.env.CONTROL_CENTRE_API_KEY?.trim();
  if (!expected) return process.env.NODE_ENV !== "production";
  const supplied =
    request.headers.get("x-control-centre-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return supplied === expected;
}
