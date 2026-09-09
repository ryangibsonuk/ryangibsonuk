import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseChatgptStates } from "./chatgpt-parse.ts";

describe("parseChatgptStates", () => {
  it("reads drizzle camelCase states", () => {
    assert.deepEqual(
      parseChatgptStates({
        states: [
          {
            taskId: "zava",
            isCompleted: true,
            updatedAt: "2026-09-09T10:00:00.000Z",
          },
          { taskId: "namecheap", isCompleted: false },
        ],
      }),
      [
        {
          taskId: "zava",
          completed: true,
          updatedAt: "2026-09-09T10:00:00.000Z",
        },
        { taskId: "namecheap", completed: false, updatedAt: undefined },
      ],
    );
  });

  it("reads snake_case and integer flags", () => {
    const states = parseChatgptStates({
      states: [{ task_id: "ivy-docs", is_completed: 1, updated_at: "2026-09-08" }],
    });
    assert.equal(states[0]?.taskId, "ivy-docs");
    assert.equal(states[0]?.completed, true);
  });

  it("ignores empty payloads", () => {
    assert.deepEqual(parseChatgptStates({}), []);
    assert.deepEqual(parseChatgptStates({ states: [] }), []);
  });
});
