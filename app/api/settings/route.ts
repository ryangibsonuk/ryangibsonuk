import { NextRequest, NextResponse } from "next/server";
import { chatgptStatus } from "@/lib/chatgpt";
import { deleteSetting, setSetting } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { chatgptAppUrl?: string };
  const url = (payload.chatgptAppUrl ?? "").trim().replace(/\/$/, "");
  if (!url) {
    deleteSetting("chatgpt_app_url");
    return NextResponse.json({ ok: true, chatgpt: chatgptStatus() });
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "ChatGPT app URL must start with http:// or https://" },
      { status: 400 },
    );
  }
  setSetting("chatgpt_app_url", url);
  return NextResponse.json({ ok: true, chatgpt: chatgptStatus() });
}
