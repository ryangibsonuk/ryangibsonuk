import { NextRequest, NextResponse } from "next/server";
import { chatgptStatus } from "@/lib/chatgpt";
import { listSyncLog } from "@/lib/db";
import { inboundSync } from "@/lib/fanout";
import { googleStatus } from "@/lib/google";
import { getIntegrationStatus } from "@/lib/status";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ...getIntegrationStatus(),
    google: googleStatus(),
    chatgpt: chatgptStatus(),
    log: listSyncLog(15),
  });
}

export async function POST(request: NextRequest) {
  const actorHeader = request.headers.get("x-hq-actor")?.trim();
  const pulled = await inboundSync(actorHeader || "Cursor");
  return NextResponse.json({
    ...pulled,
    google: googleStatus(),
    chatgpt: chatgptStatus(),
    log: listSyncLog(15),
  });
}
