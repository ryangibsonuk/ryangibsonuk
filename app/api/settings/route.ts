import { NextRequest, NextResponse } from "next/server";
import { chatgptStatus } from "@/lib/chatgpt";
import { deleteSetting, setSetting } from "@/lib/db";
import { googleFeedConfigured } from "@/lib/google-feed";
import { googleStatus } from "@/lib/google";

export const runtime = "nodejs";

function saveOrClear(key: string, value: string | undefined, present: boolean) {
  if (!present) return;
  const trimmed = (value ?? "").trim();
  if (!trimmed) deleteSetting(key);
  else setSetting(key, trimmed);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    chatgptAppUrl?: string;
    googleClientId?: string;
    googleClientSecret?: string;
    googleScriptUrl?: string;
    googleScriptToken?: string;
  };

  if ("chatgptAppUrl" in payload) {
    const url = (payload.chatgptAppUrl ?? "").trim().replace(/\/$/, "");
    if (!url) {
      deleteSetting("chatgpt_app_url");
    } else if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "ChatGPT app URL must start with http:// or https://" },
        { status: 400 },
      );
    } else {
      setSetting("chatgpt_app_url", url);
    }
  }

  saveOrClear("google_client_id", payload.googleClientId, "googleClientId" in payload);
  saveOrClear(
    "google_client_secret",
    payload.googleClientSecret,
    "googleClientSecret" in payload,
  );
  saveOrClear(
    "google_script_url",
    payload.googleScriptUrl,
    "googleScriptUrl" in payload,
  );
  saveOrClear(
    "google_script_token",
    payload.googleScriptToken,
    "googleScriptToken" in payload,
  );

  return NextResponse.json({
    ok: true,
    chatgpt: chatgptStatus(),
    google: googleStatus(),
    googleFeed: googleFeedConfigured(),
  });
}
