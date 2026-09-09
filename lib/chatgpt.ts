import { parseChatgptStates } from "./chatgpt-parse";
import { getSetting, logSync } from "./db";
import { skipped, type SyncResult } from "./google";
import type { Task } from "./types";

function chatgptConfig() {
  const url = (
    process.env.CHATGPT_APP_URL?.trim() ||
    getSetting("chatgpt_app_url") ||
    ""
  ).replace(/\/$/, "");
  const key =
    process.env.CHATGPT_APP_KEY?.trim() ||
    process.env.CONTROL_CENTRE_API_KEY?.trim() ||
    "";
  return { url, key };
}

export function chatgptConfigured(): boolean {
  return Boolean(chatgptConfig().url);
}

async function chatgptFetch(path: string, init: RequestInit = {}) {
  const { url, key } = chatgptConfig();
  if (!url) throw new Error("CHATGPT_APP_URL is not set");
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-control-centre-key": key,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(payload.error || `ChatGPT app ${response.status}`));
  }
  return payload;
}

function remoteActor(actor: string) {
  if (["ChatGPT", "Cursor", "Grok"].includes(actor)) return actor;
  return "Cursor";
}

export async function pushChatgpt(
  task: Task,
  completed: boolean,
  actor: string,
  result?: string,
): Promise<SyncResult> {
  if (!chatgptConfigured()) {
    return skipped("chatgpt", "ChatGPT app URL is not set.");
  }
  try {
    await chatgptFetch("/api/integrations/tasks", {
      method: "POST",
      body: JSON.stringify({
        taskId: task.id,
        completed,
        actor: remoteActor(actor),
        result:
          result ||
          (completed
            ? "Completed from Gibson HQ."
            : "Reopened from Gibson HQ."),
      }),
    });
    const detail = `Pushed ${task.id} to the ChatGPT Control Centre.`;
    logSync("chatgpt", true, detail);
    return { channel: "chatgpt", ok: true, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "ChatGPT push failed";
    logSync("chatgpt", false, detail);
    return { channel: "chatgpt", ok: false, detail };
  }
}

export async function pullChatgpt(): Promise<{
  completions: { taskId: string; completed: boolean; at: string }[];
  results: SyncResult[];
}> {
  if (!chatgptConfigured()) {
    return {
      completions: [],
      results: [skipped("chatgpt", "ChatGPT app URL is not set.")],
    };
  }
  try {
    const payload = await chatgptFetch("/api/integrations/tasks");
    const completions = parseChatgptStates(payload).map((state) => ({
      taskId: state.taskId,
      completed: state.completed,
      at: state.updatedAt || new Date(0).toISOString(),
    }));
    const detail = `Pulled ${completions.length} ChatGPT task states.`;
    logSync("chatgpt", true, detail);
    return { completions, results: [{ channel: "chatgpt", ok: true, detail }] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "ChatGPT pull failed";
    logSync("chatgpt", false, detail);
    return {
      completions: [],
      results: [{ channel: "chatgpt", ok: false, detail }],
    };
  }
}

export function chatgptStatus() {
  const { url } = chatgptConfig();
  return {
    configured: Boolean(url),
    url: url || null,
  };
}
