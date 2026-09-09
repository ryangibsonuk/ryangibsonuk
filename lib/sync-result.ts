export type SyncResult = { channel: string; ok: boolean; detail: string };

export function skipped(channel: string, reason: string): SyncResult {
  const detail = reason.startsWith("Skipped")
    ? reason
    : `Skipped: ${reason}`;
  return { channel, ok: true, detail };
}
