import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { githubErrorDetail } from "./github-error.ts";

describe("githubErrorDetail", () => {
  it("maps fetch failed / timeout to a host-network hint", () => {
    const error = new TypeError("fetch failed");
    error.cause = Object.assign(new Error("Connect Timeout Error"), {
      name: "ConnectTimeoutError",
      code: "UND_ERR_CONNECT_TIMEOUT",
    });
    assert.match(githubErrorDetail(error), /host network/i);
  });

  it("keeps HTTP status errors as-is", () => {
    assert.equal(githubErrorDetail(new Error("GitHub 403")), "GitHub 403");
  });
});
