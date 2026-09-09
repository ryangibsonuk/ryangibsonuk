"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ActivityEvent } from "@/lib/types";
import { loadLocalEvents } from "@/lib/local";

type HqContextValue = {
  localEvents: ActivityEvent[];
  addEvent: (event: ActivityEvent) => void;
};

const HqContext = createContext<HqContextValue | null>(null);

export function HqProvider({ children }: { children: React.ReactNode }) {
  const [localEvents, setLocalEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setLocalEvents(loadLocalEvents());
  }, []);

  const addEvent = useCallback((event: ActivityEvent) => {
    setLocalEvents((current) => {
      const next = [event, ...current.filter((item) => item.id !== event.id)];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ localEvents, addEvent }),
    [localEvents, addEvent],
  );

  return <HqContext.Provider value={value}>{children}</HqContext.Provider>;
}

export function useHq() {
  const value = useContext(HqContext);
  if (!value) throw new Error("useHq must be used inside HqProvider");
  return value;
}

export function mergeEvents(
  ...groups: ActivityEvent[][]
): ActivityEvent[] {
  const byId = new Map<string, ActivityEvent>();
  for (const group of groups) {
    for (const event of group) byId.set(event.id, event);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );
}
