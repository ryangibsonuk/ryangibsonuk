function firstHeader(h: Headers, name: string): string {
  return h.get(name)?.split(",")[0]?.trim() || "";
}

function publicHost(raw: string): string {
  return raw
    .replace(/^0\.0\.0\.0(?=[:\]]|$)/, "localhost")
    .replace(/^\[::\]/, "localhost")
    .replace(/^::(?=:[0-9]+$)/, "localhost");
}

export function originFromHeaders(h: Headers): string {
  const host = publicHost(
    firstHeader(h, "x-forwarded-host") ||
      firstHeader(h, "host") ||
      "localhost:3000",
  );
  const proto =
    firstHeader(h, "x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export function googleCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function oauthRedirectWarning(callbackUrl: string): string | null {
  try {
    const { hostname } = new URL(callbackUrl);
    if (hostname === "0.0.0.0" || hostname === "::" || hostname === "[::]") {
      return "Google rejects 0.0.0.0 as a redirect. Open HQ as http://localhost:3000, add that URI to the OAuth client, then Connect Google from that page.";
    }
    if (
      hostname.endsWith(".trycloudflare.com") ||
      hostname.endsWith(".ngrok.io") ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".loca.lt")
    ) {
      return "Google will not accept this temporary tunnel for sign-in. Open HQ at http://localhost:3000 (Cursor port forward), add http://localhost:3000/api/auth/google/callback to the OAuth client, then Connect Google from that page.";
    }
    return null;
  } catch {
    return "This page origin cannot be used for Google sign-in.";
  }
}
