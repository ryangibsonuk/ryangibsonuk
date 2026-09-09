export const UNLOCK_MAX_FAILURES = 8;
export const UNLOCK_WINDOW_MS = 15 * 60 * 1000;
export const UNLOCK_LOCK_MS = 15 * 60 * 1000;

export type UnlockGuardRow = {
  failCount: number;
  windowStart: number;
  lockedUntil: number;
};

export function checkUnlockGuard(
  row: UnlockGuardRow | null,
  now: number,
): { allowed: boolean; retryAfterSec: number } {
  if (row && row.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((row.lockedUntil - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordUnlockFailure(
  row: UnlockGuardRow | null,
  now: number,
): UnlockGuardRow {
  const startFresh =
    !row ||
    (row.lockedUntil > 0 && now >= row.lockedUntil) ||
    now - row.windowStart >= UNLOCK_WINDOW_MS;
  if (!row || startFresh) {
    return {
      failCount: 1,
      windowStart: now,
      lockedUntil: 0,
    };
  }
  const failCount = row.failCount + 1;
  return {
    failCount,
    windowStart: row.windowStart,
    lockedUntil: failCount >= UNLOCK_MAX_FAILURES ? now + UNLOCK_LOCK_MS : 0,
  };
}

export function unlockRetryMessage(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  if (minutes === 1) return "Too many attempts. Try again in a minute.";
  return `Too many attempts. Try again in ${minutes} minutes.`;
}
