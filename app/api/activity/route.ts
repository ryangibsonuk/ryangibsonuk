import { NextResponse } from "next/server";
import { getChangelog } from "@/lib/data";
import { listTaskActivity } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    changelog: getChangelog(),
    activity: listTaskActivity(100),
  });
}
