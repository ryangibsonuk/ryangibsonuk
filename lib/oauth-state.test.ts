import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { oauthStateOk, readOAuthState, signOAuthState } from "./oauth-state.ts";

describe("oauth state", () => {
  it("round-trips a redirect URI", () => {
    const state = signOAuthState({
      redirectUri: "http://localhost:3000/api/auth/google/callback",
    });
    const parsed = readOAuthState(state);
    assert.equal(
      parsed?.redirectUri,
      "http://localhost:3000/api/auth/google/callback",
    );
    assert.equal(oauthStateOk(state), true);
  });

  it("rejects tampering", () => {
    const state = signOAuthState({ redirectUri: "https://example.com" });
    const [body] = state.split(".");
    assert.equal(oauthStateOk(`${body}.deadbeef`), false);
    assert.equal(oauthStateOk("not-a-state"), false);
  });
});
