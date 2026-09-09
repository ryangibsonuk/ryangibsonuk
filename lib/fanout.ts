import { chatgptConfigured, pullChatgpt, pushChatgpt } from "./chatgpt";
import { findTask, getSeedTasks } from "./data";
import { listTaskStates, setTaskCompletion } from "./db";
import { pullGithubActivity } from "./github-feed";
import { pullGoogleFeed } from "./google-feed";
import {
  googleConnected,
  pullDrive,
  pullGmail,
  pushDrive,
  pushGmail,
  type SyncResult,
} from "./google";
import {
  pickLatestSignals,
  shouldApplySignal,
  type SyncOrigin,
  type SyncSignal,
} from "./sync-signals";
import { applyTaskStates } from "./tasks";
import type { Task } from "./types";

export type { SyncOrigin };

export async function applyAndSync(input: {
  task: Task;
  completed: boolean;
  actor: string;
  result?: string;
  origin?: SyncOrigin;
}) {
  const saved = setTaskCompletion({
    taskId: input.task.id,
    project: input.task.project,
    title: input.task.title,
    completed: input.completed,
    actor: input.actor,
    result: input.result,
  });

  const origin = input.origin ?? "hq";
  const jobs: Promise<SyncResult>[] = [];
  if (origin !== "gmail") jobs.push(pushGmail(input.task, input.completed));
  if (origin !== "drive") {
    jobs.push(pushDrive(input.task, input.completed, input.actor));
  }
  if (origin !== "chatgpt") {
    jobs.push(
      pushChatgpt(input.task, input.completed, input.actor, input.result),
    );
  }
  const outbound = await Promise.all(jobs);

  return { ...saved, sync: outbound };
}

function liveCompleted(taskId: string): boolean {
  return applyTaskStates().find((task) => task.id === taskId)?.status === "Complete";
}

function idlePull(): {
  completions: { taskId: string; completed: boolean; at: string }[];
  results: SyncResult[];
} {
  return { completions: [], results: [] };
}

export async function inboundSync(actor = "Cursor") {
  const tasks = getSeedTasks();
  const [gmail, drive, chatgpt, googleFeed, github] = await Promise.all([
    googleConnected() ? pullGmail(tasks) : idlePull(),
    googleConnected() ? pullDrive(tasks) : idlePull(),
    chatgptConfigured() ? pullChatgpt() : idlePull(),
    pullGoogleFeed(),
    pullGithubActivity(),
  ]);

  const signals: SyncSignal[] = [
    ...gmail.completions.map((item) => ({ ...item, source: "gmail" as const })),
    ...drive.completions.map((item) => ({ ...item, source: "drive" as const })),
    ...chatgpt.completions.map((item) => ({
      ...item,
      source: "chatgpt" as const,
    })),
  ];

  const local = new Map(
    listTaskStates().map((state) => [state.taskId, state]),
  );
  const applied: { taskId: string; completed: boolean; source: SyncOrigin }[] =
    [];

  for (const signal of pickLatestSignals(signals)) {
    const task = findTask(signal.taskId);
    if (!task) continue;
    if (
      !shouldApplySignal(signal, local.get(signal.taskId), liveCompleted(signal.taskId))
    ) {
      continue;
    }
    await applyAndSync({
      task,
      completed: signal.completed,
      actor,
      result: `Inbound ${signal.source} sync.`,
      origin: signal.source,
    });
    applied.push({
      taskId: signal.taskId,
      completed: signal.completed,
      source: signal.source,
    });
  }

  return {
    applied,
    results: [
      ...gmail.results,
      ...drive.results,
      ...chatgpt.results,
      googleFeed,
      github,
    ],
    states: listTaskStates(),
    tasks: applyTaskStates(),
  };
}
