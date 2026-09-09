import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { skipped } from "./sync-result.ts";

describe("skipped sync result", () => {
  it("is success so Sync now does not treat unwired channels as failures", () => {
    const result = skipped("gmail", "Google is not connected.");
    assert.equal(result.ok, true);
    assert.equal(result.channel, "gmail");
    assert.equal(result.detail, "Skipped: Google is not connected.");
  });
});
