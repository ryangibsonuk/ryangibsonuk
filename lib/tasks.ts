import { getSeedTasks } from "./data";
import { listTaskStates } from "./db";
import type { Task, TaskState } from "./types";

export function applyTaskStates(
  tasks = getSeedTasks(),
  states = listTaskStates(),
): Task[] {
  const map = new Map(states.map((state) => [state.taskId, state]));
  return tasks.map((task) => {
    const state = map.get(task.id);
    if (state?.isCompleted) return { ...task, status: "Complete" };
    if (state && !state.isCompleted && task.status === "Complete") {
      return { ...task, status: "Ready" };
    }
    return task;
  });
}

export function statesById(states = listTaskStates()): Record<string, TaskState> {
  return Object.fromEntries(states.map((state) => [state.taskId, state]));
}
