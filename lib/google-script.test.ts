import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GOOGLE_ACTIVITY_SCRIPT } from "./google-script.ts";

describe("google activity script", () => {
  it("is a deployable Apps Script web app", () => {
    assert.match(GOOGLE_ACTIVITY_SCRIPT, /function doGet/);
    assert.match(GOOGLE_ACTIVITY_SCRIPT, /GmailApp/);
    assert.match(GOOGLE_ACTIVITY_SCRIPT, /CalendarApp/);
    assert.match(GOOGLE_ACTIVITY_SCRIPT, /DriveApp/);
  });
});
