export type SyncOrigin = "hq" | "gmail" | "drive" | "chatgpt";

export type SyncSignal = {
  taskId: string;
  completed: boolean;
  source: SyncOrigin;
  at: string;
};

export function pickLatestSignals(signals: SyncSignal[]): SyncSignal[] {
  const latest = new Map<string, SyncSignal>();
  for (const signal of signals) {
    const current = latest.get(signal.taskId);
    if (!current || signal.at >= current.at) latest.set(signal.taskId, signal);
  }
  return [...latest.values()];
}

export function shouldApplySignal(
  signal: SyncSignal,
  local: { isCompleted: boolean; updatedAt: string } | undefined,
  liveCompleted: boolean,
): boolean {
  if (liveCompleted === signal.completed) return false;
  if (local?.updatedAt && signal.at && signal.at < local.updatedAt) return false;
  return true;
}
