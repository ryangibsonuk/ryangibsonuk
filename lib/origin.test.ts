import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  googleCallbackUrl,
  oauthRedirectWarning,
  originFromHeaders,
} from "./origin-core.ts";

describe("originFromHeaders", () => {
  it("prefers forwarded host and proto", () => {
    const h = new Headers({
      host: "0.0.0.0:3000",
      "x-forwarded-host": "hq.example",
      "x-forwarded-proto": "https",
    });
    assert.equal(originFromHeaders(h), "https://hq.example");
  });

  it("maps a 0.0.0.0 bind address to localhost", () => {
    const h = new Headers({ host: "0.0.0.0:3000" });
    assert.equal(originFromHeaders(h), "http://localhost:3000");
  });

  it("keeps loopback HTTP", () => {
    const h = new Headers({ host: "127.0.0.1:3000" });
    assert.equal(originFromHeaders(h), "http://127.0.0.1:3000");
  });
});

describe("oauthRedirectWarning", () => {
  it("warns on tunnel hosts", () => {
    const note = oauthRedirectWarning(
      "https://abc.trycloudflare.com/api/auth/google/callback",
    );
    assert.match(note ?? "", /localhost:3000/);
  });

  it("allows localhost", () => {
    assert.equal(
      oauthRedirectWarning("http://localhost:3000/api/auth/google/callback"),
      null,
    );
  });
});

describe("googleCallbackUrl", () => {
  it("appends the Google callback path", () => {
    assert.equal(
      googleCallbackUrl("http://localhost:3000"),
      "http://localhost:3000/api/auth/google/callback",
    );
  });
});
