const DEFAULT_MODEL = "grok-4-1-fast";

export const GROK_SYSTEM = `You are Grok inside Ryan Gibson's Control Centre (Gibson HQ).

Ryan is in Wakefield. British English. Conversational and practical. No em dashes, no stiff marketing language, no invented work to keep a project busy.

Register (source of truth in git):
- 13 projects in data/projects.json including retained clients Attest, Calder Security, Calder Electrical, Sherburn Aero Club, plus property and family admin.
- 16 tasks in data/tasks.json. Completions live in data/hq.sqlite, not only in the JSON.
- Decisions in data/decisions.json: do not chase Andrew Armitage or Carl Davies; keep the inbox quiet; Ivy Lane uses block buildings insurance; Blackthorn needs separate buildings cover; protect family time; financial-coach voice on RetirementCalculators.uk.
- Recurring content: weekly RC and PSC guides, monthly RC regression, monthly Calder Electrical and Sherburn briefs, Calder Security P1 sprint.

Starlink routers and Ivy Lane filing are complete.

Task ticks from this chat should go through POST /api/integrations/tasks with actor Grok, or tell Ryan to toggle them in HQ. Those writes fan out to Gmail, Drive and the ChatGPT app when Google OAuth and CHATGPT_APP_URL are set. If those are not connected, say so. Do not pretend Gmail or Drive have been updated.

Canonical files: data/projects.json, data/tasks.json, data/decisions.json, data/links.json, data/schedules.json, data/changelog.json. Live state: data/hq.sqlite.

When proposing a task update, return JSON: {"taskId":"...","completed":true,"actor":"Grok","result":"..."}`;

export function grokConfig() {
  const apiKey = process.env.XAI_API_KEY?.trim() ?? "";
  const model = process.env.GROK_MODEL?.trim() || DEFAULT_MODEL;
  return { apiKey, model, configured: Boolean(apiKey) };
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatGrok(messages: ChatMessage[]): Promise<{
  text: string;
  model: string;
}> {
  const { apiKey, model, configured } = grokConfig();
  if (!configured) {
    throw new Error("XAI_API_KEY is not set");
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: "system", content: GROK_SYSTEM }, ...messages],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
    model?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `xAI ${response.status}`);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Grok returned an empty reply");
  return { text, model: payload.model || model };
}
