import { NextResponse } from "next/server";
import {
  getChangelog,
  getDecisions,
  getLinks,
  getProjects,
  getSchedules,
  getSeedTasks,
} from "@/lib/data";
import { listTaskActivity, listTaskStates } from "@/lib/db";
import { integrationKeyOk } from "@/lib/status";
import { applyTaskStates } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!integrationKeyOk(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    projects: getProjects(),
    tasks: applyTaskStates(getSeedTasks(), listTaskStates()),
    decisions: getDecisions(),
    schedules: getSchedules(),
    links: getLinks(),
    changelog: getChangelog(),
    activity: listTaskActivity(100),
  });
}
