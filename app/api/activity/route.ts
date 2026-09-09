import { NextResponse } from "next/server";
import { buildFeed } from "@/lib/feed";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ feed: buildFeed(100) });
}
