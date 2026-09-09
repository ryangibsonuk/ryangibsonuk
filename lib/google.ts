import {
  clearOAuthToken,
  getOAuthToken,
  logSync,
  saveOAuthToken,
} from "./db";
import { parseRecord } from "./records";
import type { Task } from "./types";

const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
].join(" ");

const HQ_LABEL = "HQ";
const HQ_COMPLETE = "HQ/Complete";
const SYNC_SHEET_NAME = "Gibson HQ Sync";
const HQ_TAB = "Gibson HQ";

export type SyncResult = { channel: string; ok: boolean; detail: string };

export type CompletionSignal = {
  taskId: string;
  completed: boolean;
  at: string;
};

export function googleClient() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI?.trim() ||
      "http://localhost:3000/api/auth/google/callback",
  };
}

export function googleConfigured(): boolean {
  const { clientId, clientSecret } = googleClient();
  return Boolean(clientId && clientSecret);
}

export function googleConnected(): boolean {
  return Boolean(getOAuthToken("google")?.refreshToken);
}

export function googleAuthUrl(state: string, redirectUri?: string): string {
  const { clientId } = googleClient();
  const redirect = redirectUri || googleClient().redirectUri;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>) {
  const { clientId, clientSecret } = googleClient();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...body,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Google token exchange failed",
    );
  }
  return payload;
}

function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export async function exchangeGoogleCode(code: string, redirectUri?: string) {
  const payload = await tokenRequest({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri || googleClient().redirectUri,
  });
  if (!payload.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Remove HQ from Google Account permissions and connect again.",
    );
  }
  saveOAuthToken({
    provider: "google",
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiry: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
    email: emailFromIdToken(payload.id_token),
  });
}

async function accessToken(): Promise<string> {
  const stored = getOAuthToken("google");
  if (!stored) throw new Error("Google is not connected");
  if (
    stored.accessToken &&
    stored.expiry &&
    new Date(stored.expiry).getTime() - 60_000 > Date.now()
  ) {
    return stored.accessToken;
  }
  const payload = await tokenRequest({
    refresh_token: stored.refreshToken,
    grant_type: "refresh_token",
  });
  saveOAuthToken({
    provider: "google",
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || stored.refreshToken,
    expiry: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
    email: stored.email,
  });
  return payload.access_token!;
}

function errorMessage(json: Record<string, unknown>, text: string, status: number) {
  const err = json.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  if (json.error_description) return String(json.error_description);
  return text.slice(0, 400) || String(status);
}

async function googleFetch(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = { raw: text };
    }
  }
  if (!response.ok) {
    throw new Error(errorMessage(json, text, response.status));
  }
  return json;
}

export async function disconnectGoogle() {
  clearOAuthToken("google");
}

type GmailLabel = { id: string; name: string };

async function labels(): Promise<GmailLabel[]> {
  const payload = await googleFetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
  );
  return (payload.labels as GmailLabel[]) ?? [];
}

async function ensureLabel(name: string): Promise<string> {
  const existing = (await labels()).find((label) => label.name === name);
  if (existing) return existing.id;
  const created = await googleFetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    },
  );
  return String(created.id);
}

async function modifyThread(threadId: string, add: string[], remove: string[]) {
  try {
    await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`,
      {
        method: "POST",
        body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
      },
    );
  } catch {
    await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${threadId}/modify`,
      {
        method: "POST",
        body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
      },
    );
  }
}

export async function pushGmail(
  task: Task,
  completed: boolean,
): Promise<SyncResult> {
  const parsed = parseRecord(task.href);
  if (parsed.kind !== "gmail") {
    return { channel: "gmail", ok: true, detail: "No Gmail record on this task." };
  }
  if (!googleConnected()) {
    return { channel: "gmail", ok: false, detail: "Google is not connected." };
  }
  try {
    const hq = await ensureLabel(HQ_LABEL);
    const done = await ensureLabel(HQ_COMPLETE);
    if (completed) {
      await modifyThread(parsed.threadId, [hq, done], ["UNREAD"]);
      const detail = `Gmail thread labelled HQ/Complete and marked read.`;
      logSync("gmail", true, `${task.id}: ${detail}`);
      return { channel: "gmail", ok: true, detail };
    }
    await modifyThread(parsed.threadId, [hq], [done]);
    const detail = `Gmail thread reopened (HQ/Complete removed).`;
    logSync("gmail", true, `${task.id}: ${detail}`);
    return { channel: "gmail", ok: true, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Gmail push failed";
    logSync("gmail", false, `${task.id}: ${detail}`);
    return { channel: "gmail", ok: false, detail };
  }
}

export async function pullGmail(tasks: Task[]): Promise<{
  completions: CompletionSignal[];
  results: SyncResult[];
}> {
  if (!googleConnected()) {
    return {
      completions: [],
      results: [{ channel: "gmail", ok: false, detail: "Google is not connected." }],
    };
  }
  const completions: CompletionSignal[] = [];
  try {
    const allLabels = await labels();
    const hq = allLabels.find((label) => label.name === HQ_LABEL);
    const done = allLabels.find((label) => label.name === HQ_COMPLETE);
    if (!hq && !done) {
      return {
        completions: [],
        results: [{ channel: "gmail", ok: true, detail: "No HQ Gmail labels yet." }],
      };
    }
    const now = new Date().toISOString();
    for (const task of tasks) {
      const parsed = parseRecord(task.href);
      if (parsed.kind !== "gmail") continue;
      const thread = await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${parsed.threadId}?format=minimal`,
      ).catch(() =>
        googleFetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${parsed.threadId}?format=minimal`,
        ),
      );
      const messages = (thread.messages as { labelIds?: string[] }[] | undefined) ?? [
        thread as { labelIds?: string[] },
      ];
      const labelIds = new Set(messages.flatMap((message) => message.labelIds ?? []));
      const hasHq = Boolean(hq && labelIds.has(hq.id));
      const hasDone = Boolean(done && labelIds.has(done.id));
      if (!hasHq && !hasDone) continue;
      completions.push({ taskId: task.id, completed: hasDone, at: now });
    }
    const detail = `Read ${completions.length} Gmail-labelled tasks.`;
    logSync("gmail", true, detail);
    return { completions, results: [{ channel: "gmail", ok: true, detail }] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Gmail pull failed";
    logSync("gmail", false, detail);
    return {
      completions: [],
      results: [{ channel: "gmail", ok: false, detail }],
    };
  }
}

function sheetRange(range: string) {
  return encodeURIComponent(`'${HQ_TAB}'!${range}`);
}

async function ensureSyncSheet(): Promise<string> {
  const found = await googleFetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${SYNC_SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    )}&fields=files(id,name)&pageSize=1`,
  );
  const files = (found.files as { id: string }[] | undefined) ?? [];
  if (files[0]?.id) return files[0].id;

  const created = await googleFetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      body: JSON.stringify({
        properties: { title: SYNC_SHEET_NAME },
        sheets: [{ properties: { title: "Log" } }],
      }),
    },
  );
  const id = String(created.spreadsheetId);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Log!A1:H1?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({
        values: [["When", "Task ID", "Title", "Project", "Completed", "Actor", "Source", "Detail"]],
      }),
    },
  );
  return id;
}

async function appendLogSheet(
  task: Task,
  completed: boolean,
  actor: string,
) {
  const sheetId = await ensureSyncSheet();
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Log!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [
          [
            new Date().toISOString(),
            task.id,
            task.title,
            task.project,
            completed ? "yes" : "no",
            actor,
            "hq",
            completed ? "Completed from Control Centre" : "Reopened from Control Centre",
          ],
        ],
      }),
    },
  );
}

async function ensureHqTab(spreadsheetId: string) {
  const meta = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
  );
  const sheets = (meta.sheets as { properties?: { title?: string } }[] | undefined) ?? [];
  const exists = sheets.some((sheet) => sheet.properties?.title === HQ_TAB);
  if (!exists) {
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: HQ_TAB } } }],
        }),
      },
    );
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange("A1:F1")}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({
          values: [["Task ID", "Title", "Project", "Completed", "Updated", "Actor"]],
        }),
      },
    );
  }
}

async function upsertHqTab(
  spreadsheetId: string,
  task: Task,
  completed: boolean,
  actor: string,
) {
  await ensureHqTab(spreadsheetId);
  const payload = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange("A2:F")}`,
  );
  const rows = (payload.values as string[][] | undefined) ?? [];
  const idx = rows.findIndex((row) => row[0] === task.id);
  const row = [
    task.id,
    task.title,
    task.project,
    completed ? "yes" : "no",
    new Date().toISOString(),
    actor,
  ];
  if (idx >= 0) {
    const rowNumber = idx + 2;
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(
        `A${rowNumber}:F${rowNumber}`,
      )}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [row] }),
      },
    );
    return;
  }
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(
      "A1",
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    },
  );
}

async function readHqTab(spreadsheetId: string): Promise<CompletionSignal[]> {
  try {
    const payload = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange("A2:F")}`,
    );
    const rows = (payload.values as string[][] | undefined) ?? [];
    return rows
      .filter((row) => row[0])
      .map((row) => ({
        taskId: row[0],
        completed: String(row[3] ?? "").toLowerCase().startsWith("y"),
        at: row[4] || new Date(0).toISOString(),
      }));
  } catch {
    return [];
  }
}

function folderNoteName(taskId: string) {
  return `hq-task-${taskId}.json`;
}

async function upsertFolderNote(
  folderId: string,
  task: Task,
  completed: boolean,
  actor: string,
) {
  const name = folderNoteName(task.id);
  const listed = await googleFetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${name}' and '${folderId}' in parents and trashed=false`,
    )}&fields=files(id,name)&pageSize=1`,
  );
  const content = JSON.stringify(
    {
      taskId: task.id,
      title: task.title,
      project: task.project,
      completed,
      actor,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  const existingId = (listed.files as { id: string }[] | undefined)?.[0]?.id;
  const token = await accessToken();
  if (existingId) {
    const upload = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: content,
      },
    );
    if (!upload.ok) throw new Error((await upload.text()).slice(0, 300));
    return;
  }

  const boundary = "hq_boundary";
  const metadata = JSON.stringify({
    name,
    parents: [folderId],
    mimeType: "application/json",
  });
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");
  const upload = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!upload.ok) throw new Error((await upload.text()).slice(0, 300));
}

async function readFolderNotes(
  folderId: string,
): Promise<CompletionSignal[]> {
  const listed = await googleFetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name contains 'hq-task-' and '${folderId}' in parents and trashed=false`,
    )}&fields=files(id,name,modifiedTime)&pageSize=50`,
  );
  const files = (listed.files as { id: string; name: string; modifiedTime?: string }[] | undefined) ?? [];
  const signals: CompletionSignal[] = [];
  for (const file of files) {
    const payload = await googleFetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    );
    const taskId =
      typeof payload.taskId === "string"
        ? payload.taskId
        : file.name.replace(/^hq-task-/, "").replace(/\.json$/, "");
    if (!taskId) continue;
    signals.push({
      taskId,
      completed: payload.completed === true || payload.completed === "yes",
      at:
        (typeof payload.updatedAt === "string" && payload.updatedAt) ||
        file.modifiedTime ||
        new Date(0).toISOString(),
    });
  }
  return signals;
}

export async function pushDrive(
  task: Task,
  completed: boolean,
  actor: string,
): Promise<SyncResult> {
  if (!googleConnected()) {
    return { channel: "drive", ok: false, detail: "Google is not connected." };
  }
  const wrote: string[] = [];
  try {
    await appendLogSheet(task, completed, actor);
    wrote.push(SYNC_SHEET_NAME);

    const parsed = parseRecord(task.href);
    if (parsed.kind === "spreadsheet") {
      await upsertHqTab(parsed.spreadsheetId, task, completed, actor);
      wrote.push("linked sheet tab");
    }
    if (parsed.kind === "drive-folder") {
      await upsertFolderNote(parsed.folderId, task, completed, actor);
      wrote.push("folder status file");
    }

    const detail = `Wrote ${task.id} to ${wrote.join(", ")}.`;
    logSync("drive", true, detail);
    return { channel: "drive", ok: true, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Drive push failed";
    logSync("drive", false, `${task.id}: ${detail}`);
    return { channel: "drive", ok: false, detail };
  }
}

export async function pullDrive(tasks: Task[]): Promise<{
  completions: CompletionSignal[];
  results: SyncResult[];
}> {
  if (!googleConnected()) {
    return {
      completions: [],
      results: [{ channel: "drive", ok: false, detail: "Google is not connected." }],
    };
  }
  try {
    const completions: CompletionSignal[] = [];
    const sheetCache = new Map<string, CompletionSignal[]>();
    const folderCache = new Map<string, CompletionSignal[]>();

    for (const task of tasks) {
      const parsed = parseRecord(task.href);
      if (parsed.kind === "spreadsheet") {
        if (!sheetCache.has(parsed.spreadsheetId)) {
          sheetCache.set(parsed.spreadsheetId, await readHqTab(parsed.spreadsheetId));
        }
        const match = sheetCache
          .get(parsed.spreadsheetId)
          ?.find((row) => row.taskId === task.id);
        if (match) completions.push(match);
      }
      if (parsed.kind === "drive-folder") {
        if (!folderCache.has(parsed.folderId)) {
          folderCache.set(parsed.folderId, await readFolderNotes(parsed.folderId));
        }
        const match = folderCache
          .get(parsed.folderId)
          ?.find((row) => row.taskId === task.id);
        if (match) completions.push(match);
      }
    }

    const detail = `Read ${completions.length} Drive status records.`;
    logSync("drive", true, detail);
    return { completions, results: [{ channel: "drive", ok: true, detail }] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Drive pull failed";
    logSync("drive", false, detail);
    return {
      completions: [],
      results: [{ channel: "drive", ok: false, detail }],
    };
  }
}

export function googleStatus() {
  const token = getOAuthToken("google");
  return {
    configured: googleConfigured(),
    connected: Boolean(token?.refreshToken),
    email: token?.email ?? null,
  };
}
