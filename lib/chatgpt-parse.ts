export type ChatgptState = {
  taskId: string;
  completed: boolean;
  updatedAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function truthy(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function parseChatgptStates(payload: unknown): ChatgptState[] {
  const root = asRecord(payload);
  const raw = root?.states;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    const state = asRecord(entry);
    if (!state) return [];
    const taskId = String(state.taskId || state.task_id || "").trim();
    if (!taskId) return [];
    const updatedAt = state.updatedAt || state.updated_at;
    return [
      {
        taskId,
        completed: truthy(state.isCompleted ?? state.is_completed),
        updatedAt: typeof updatedAt === "string" ? updatedAt : undefined,
      },
    ];
  });
}
