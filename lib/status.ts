import { chatgptStatus } from "./chatgpt";
import { googleFeedConfigured } from "./google-feed";
import { googleStatus } from "./google";
import { grokConfig } from "./grok";
import type { IntegrationStatus } from "./types";

export function getIntegrationStatus(): IntegrationStatus {
  const { configured, model } = grokConfig();
  const google = googleStatus();
  const chatgpt = chatgptStatus();
  return {
    grok: configured,
    ingest: Boolean(process.env.INGEST_SECRET?.trim()),
    github: Boolean(process.env.GITHUB_TOKEN?.trim()),
    pin: Boolean(process.env.DASHBOARD_PIN?.trim()),
    apiKey: Boolean(process.env.CONTROL_CENTRE_API_KEY?.trim()),
    model,
    githubUser: process.env.GITHUB_USERNAME?.trim() || "ryangibsonuk",
    google: google.connected,
    googleEmail: google.email,
    googleConfigured: google.configured,
    googleFeed: googleFeedConfigured(),
    chatgpt: chatgpt.configured,
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
