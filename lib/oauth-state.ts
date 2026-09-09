import { createHmac, randomBytes } from "node:crypto";

function stateSecret() {
  return (
    process.env.CONTROL_CENTRE_API_KEY?.trim() ||
    process.env.DASHBOARD_PIN?.trim() ||
    "gibson-hq-oauth"
  );
}

export function signOAuthState(payload: Record<string, string> = {}): string {
  const nonce = randomBytes(12).toString("hex");
  const body = Buffer.from(
    JSON.stringify({ n: nonce, ...payload }),
  ).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function readOAuthState(state: string): Record<string, string> | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", stateSecret()).update(body).digest("hex");
  if (expected !== sig) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Record<string, string>;
    return parsed;
  } catch {
    return null;
  }
}

export function oauthStateOk(state: string): boolean {
  return readOAuthState(state) !== null;
}
