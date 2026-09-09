import { NextRequest, NextResponse } from "next/server";
import { findTask } from "@/lib/data";
import { listTaskActivity, listTaskStates, setTaskCompletion } from "@/lib/db";
import { applyTaskStates } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({
      states: listTaskStates(),
      activity: listTaskActivity(50),
      tasks: applyTaskStates(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Task updates are temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      taskId?: string;
      completed?: boolean;
      actor?: string;
      result?: string;
    };
    const task = payload.taskId ? findTask(payload.taskId) : undefined;
    if (!task || typeof payload.completed !== "boolean") {
      return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
    }
    const saved = setTaskCompletion({
      taskId: task.id,
      project: task.project,
      title: task.title,
      completed: payload.completed,
      actor: payload.actor?.trim() || "Ryan",
      result: payload.result,
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Task updates are temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
