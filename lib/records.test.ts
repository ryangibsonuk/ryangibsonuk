import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseRecord } from "./records.ts";
import type { Task } from "./types.ts";

describe("parseRecord", () => {
  it("reads Gmail thread URLs from the register", () => {
    const parsed = parseRecord("https://mail.google.com/mail/#all/1a080ae66ae012dc");
    assert.deepEqual(parsed, { kind: "gmail", threadId: "1a080ae66ae012dc" });
  });

  it("reads inbox and user-scoped Gmail URLs", () => {
    const parsed = parseRecord(
      "https://mail.google.com/mail/u/0/#inbox/1a0802adec68e8a6",
    );
    assert.deepEqual(parsed, { kind: "gmail", threadId: "1a0802adec68e8a6" });
  });

  it("reads Drive folders and Sheets", () => {
    assert.deepEqual(
      parseRecord(
        "https://drive.google.com/drive/folders/1-_p6OFMkz8ZYSetq9q_-9pwFlj4hojdm",
      ),
      {
        kind: "drive-folder",
        folderId: "1-_p6OFMkz8ZYSetq9q_-9pwFlj4hojdm",
      },
    );
    assert.deepEqual(
      parseRecord(
        "https://docs.google.com/spreadsheets/d/1XPkpnMjhuYMqD88NTf6vXzhBVG83prSsiXeZLl9Q2ws/edit",
      ),
      {
        kind: "spreadsheet",
        spreadsheetId: "1XPkpnMjhuYMqD88NTf6vXzhBVG83prSsiXeZLl9Q2ws",
      },
    );
  });

  it("classifies every task href in the register", () => {
    const tasks = JSON.parse(
      readFileSync(new URL("../data/tasks.json", import.meta.url), "utf8"),
    ) as Task[];
    const kinds = Object.fromEntries(
      tasks.map((task) => [task.id, parseRecord(task.href).kind]),
    );
    assert.equal(kinds.zava, "gmail");
    assert.equal(kinds.namecheap, "gmail");
    assert.equal(kinds["ivy-docs"], "drive-folder");
    assert.equal(kinds["calder-security-sprint"], "spreadsheet");
    assert.equal(kinds["rc-weekly"], "web");
    assert.equal(kinds.routers, "none");
    assert.equal(kinds.school, "none");
  });
});
