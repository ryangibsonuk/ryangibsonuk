import { NextRequest, NextResponse } from "next/server";
import {
  getChangelog,
  getDecisions,
  getLinks,
  getProjects,
  getSchedules,
  findTask,
  getSeedTasks,
} from "@/lib/data";
import { listTaskActivity, listTaskStates, setTaskCompletion } from "@/lib/db";
import { integrationKeyOk } from "@/lib/status";
import { applyTaskStates } from "@/lib/tasks";
import { ASSISTANT_ACTORS } from "@/lib/types";

export const runtime = "nodejs";

const tools = [
  {
    name: "list_register",
    description: "Read the full Control Centre register: projects, tasks, decisions, links, schedules, changelog.",
  },
  {
    name: "list_tasks",
    description: "List live tasks with completion state.",
  },
  {
    name: "update_task",
    description:
      "Mark a task complete or reopen it. Params: taskId, completed (boolean), actor (ChatGPT|Cursor|Grok), optional result.",
  },
  {
    name: "list_projects",
    description: "List the 13 projects.",
  },
  {
    name: "list_decisions",
    description: "List standing decisions and working rules.",
  },
];

export async function GET() {
  return NextResponse.json({
    name: "gibson-hq",
    version: "1.0.0",
    tools,
    auth: "Send header x-control-centre-key or Authorization: Bearer with CONTROL_CENTRE_API_KEY. In development the key is optional.",
  });
}

export async function POST(request: NextRequest) {
  if (!integrationKeyOk(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json()) as {
    method?: string;
    name?: string;
    params?: Record<string, unknown>;
  };
  const name = body.method || body.name;
  const params = body.params ?? {};

  try {
    if (name === "list_register") {
      return NextResponse.json({
        projects: getProjects(),
        tasks: applyTaskStates(),
        decisions: getDecisions(),
        schedules: getSchedules(),
        links: getLinks(),
        changelog: getChangelog(),
        activity: listTaskActivity(100),
      });
    }
    if (name === "list_tasks") {
      return NextResponse.json({
        tasks: applyTaskStates(getSeedTasks(), listTaskStates()),
        states: listTaskStates(),
      });
    }
    if (name === "list_projects") {
      return NextResponse.json({ projects: getProjects() });
    }
    if (name === "list_decisions") {
      return NextResponse.json({ decisions: getDecisions() });
    }
    if (name === "update_task") {
      const taskId = String(params.taskId ?? "");
      const task = findTask(taskId);
      const actor = String(params.actor ?? "");
      if (
        !task ||
        typeof params.completed !== "boolean" ||
        !(ASSISTANT_ACTORS as readonly string[]).includes(actor)
      ) {
        return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
      }
      const saved = setTaskCompletion({
        taskId: task.id,
        project: task.project,
        title: task.title,
        completed: params.completed,
        actor,
        result: typeof params.result === "string" ? params.result : undefined,
      });
      return NextResponse.json({ ok: true, ...saved });
    }
    return NextResponse.json({ error: `Unknown method ${name}` }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "MCP call failed" }, { status: 503 });
  }
}
