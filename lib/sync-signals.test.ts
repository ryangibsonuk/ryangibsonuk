import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickLatestSignals, shouldApplySignal } from "./sync-signals.ts";

describe("pickLatestSignals", () => {
  it("keeps the newest signal per task", () => {
    const picked = pickLatestSignals([
      {
        taskId: "zava",
        completed: false,
        source: "chatgpt",
        at: "2026-09-08T10:00:00.000Z",
      },
      {
        taskId: "zava",
        completed: true,
        source: "gmail",
        at: "2026-09-09T10:00:00.000Z",
      },
      {
        taskId: "namecheap",
        completed: true,
        source: "drive",
        at: "2026-09-09T09:00:00.000Z",
      },
    ]);
    const byId = Object.fromEntries(picked.map((item) => [item.taskId, item]));
    assert.equal(byId.zava.completed, true);
    assert.equal(byId.zava.source, "gmail");
    assert.equal(byId.namecheap.source, "drive");
  });
});

describe("shouldApplySignal", () => {
  it("skips when HQ already matches", () => {
    assert.equal(
      shouldApplySignal(
        {
          taskId: "zava",
          completed: true,
          source: "gmail",
          at: "2026-09-09T12:00:00.000Z",
        },
        { isCompleted: true, updatedAt: "2026-09-09T11:00:00.000Z" },
        true,
      ),
      false,
    );
  });

  it("skips stale remotes", () => {
    assert.equal(
      shouldApplySignal(
        {
          taskId: "zava",
          completed: false,
          source: "chatgpt",
          at: "2026-09-08T10:00:00.000Z",
        },
        { isCompleted: true, updatedAt: "2026-09-09T11:00:00.000Z" },
        true,
      ),
      false,
    );
  });

  it("applies a newer remote that differs", () => {
    assert.equal(
      shouldApplySignal(
        {
          taskId: "zava",
          completed: true,
          source: "chatgpt",
          at: "2026-09-09T12:00:00.000Z",
        },
        { isCompleted: false, updatedAt: "2026-09-09T11:00:00.000Z" },
        false,
      ),
      true,
    );
  });
});
