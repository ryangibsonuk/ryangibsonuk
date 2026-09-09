import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  UNLOCK_LOCK_MS,
  UNLOCK_MAX_FAILURES,
  UNLOCK_WINDOW_MS,
  checkUnlockGuard,
  recordUnlockFailure,
  unlockRetryMessage,
} from "./unlock-guard.ts";

describe("unlock guard", () => {
  it("allows the first attempt", () => {
    assert.deepEqual(checkUnlockGuard(null, 1_000), {
      allowed: true,
      retryAfterSec: 0,
    });
  });

  it("locks after too many failures in the window", () => {
    const now = 1_700_000_000_000;
    let row = recordUnlockFailure(null, now);
    for (let i = 1; i < UNLOCK_MAX_FAILURES; i += 1) {
      row = recordUnlockFailure(row, now + i * 1_000);
    }
    assert.equal(row.failCount, UNLOCK_MAX_FAILURES);
    assert.equal(row.lockedUntil, now + (UNLOCK_MAX_FAILURES - 1) * 1_000 + UNLOCK_LOCK_MS);
    const locked = checkUnlockGuard(row, row.lockedUntil - 1);
    assert.equal(locked.allowed, false);
    assert.ok(locked.retryAfterSec >= 1);
  });

  it("starts a new window after the lock expires", () => {
    const now = 1_000;
    let row = recordUnlockFailure(null, now);
    for (let i = 1; i < UNLOCK_MAX_FAILURES; i += 1) {
      row = recordUnlockFailure(row, now);
    }
    const afterLock = recordUnlockFailure(row, row.lockedUntil);
    assert.equal(afterLock.failCount, 1);
    assert.equal(afterLock.lockedUntil, 0);
    assert.equal(checkUnlockGuard(afterLock, row.lockedUntil).allowed, true);
  });

  it("resets the count after the window", () => {
    const now = 5_000;
    const stale = recordUnlockFailure(null, now);
    const next = recordUnlockFailure(stale, now + UNLOCK_WINDOW_MS);
    assert.equal(next.failCount, 1);
    assert.equal(next.windowStart, now + UNLOCK_WINDOW_MS);
  });

  it("formats a retry message in minutes", () => {
    assert.equal(
      unlockRetryMessage(30),
      "Too many attempts. Try again in a minute.",
    );
    assert.equal(
      unlockRetryMessage(180),
      "Too many attempts. Try again in 3 minutes.",
    );
  });
});
