import { NextRequest, NextResponse } from "next/server";
import { findTask, getSeedTasks } from "@/lib/data";
import { listTaskActivity, listTaskStates, setTaskCompletion } from "@/lib/db";
import { integrationKeyOk } from "@/lib/status";
import { applyTaskStates } from "@/lib/tasks";
import { ASSISTANT_ACTORS } from "@/lib/types";

export const runtime = "nodejs";

const allowed = new Set<string>(ASSISTANT_ACTORS);

export async function GET(request: NextRequest) {
  if (!integrationKeyOk(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    return NextResponse.json({
      tasks: applyTaskStates(getSeedTasks(), listTaskStates()),
      states: listTaskStates(),
      activity: listTaskActivity(100),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Task service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!integrationKeyOk(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    const payload = (await request.json()) as {
      taskId?: string;
      completed?: boolean;
      actor?: string;
      result?: string;
    };
    const task = payload.taskId ? findTask(payload.taskId) : undefined;
    if (
      !task ||
      typeof payload.completed !== "boolean" ||
      !payload.actor ||
      !allowed.has(payload.actor)
    ) {
      return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
    }
    const saved = setTaskCompletion({
      taskId: task.id,
      project: task.project,
      title: task.title,
      completed: payload.completed,
      actor: payload.actor,
      result: payload.result,
    });
    return NextResponse.json({
      success: true,
      taskId: task.id,
      completed: payload.completed,
      actor: payload.actor,
      updatedAt: saved.state.updatedAt,
      activity: saved.activity,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Task service unavailable" }, { status: 503 });
  }
}
