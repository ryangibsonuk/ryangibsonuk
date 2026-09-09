const SOURCE_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  cursor: "Cursor",
  grok: "Grok",
  "grok-bot": "Grok Bot",
  github: "GitHub",
  life: "Life",
  manual: "Note",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source;
}

export function formatDay(iso: string, timeZone = "Europe/London"): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);
}

export function formatStamp(iso: string, timeZone = "Europe/London"): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function greeting(now = new Date(), timeZone = "Europe/London"): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(
      now,
    ),
  );
  if (hour < 5) return "Still up, Ryan";
  if (hour < 12) return "Morning, Ryan";
  if (hour < 17) return "Afternoon, Ryan";
  return "Evening, Ryan";
}

export function relativeDay(iso: string, timeZone = "Europe/London"): string {
  const today = formatDay(new Date().toISOString(), timeZone);
  const that = formatDay(iso, timeZone);
  if (today === that) return "Today";
  return that;
}
