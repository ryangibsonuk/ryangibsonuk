function causeChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    if (current instanceof Error) {
      parts.push(current.name, current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}

export function githubErrorDetail(error: unknown): string {
  const blob = causeChain(error);
  if (
    /timeout|UND_ERR_CONNECT|ConnectTimeout|fetch failed|ECONNRESET|ENETUNREACH|EAI_AGAIN|ECONNREFUSED/i.test(
      blob,
    )
  ) {
    return "GitHub is unreachable from this container. On Linux, start HQ with ./scripts/docker-up.sh so it uses the host network.";
  }
  return error instanceof Error ? error.message : "GitHub pull failed";
}

export function githubShouldRetry(error: unknown): boolean {
  return /timeout|UND_ERR_CONNECT|ConnectTimeout|fetch failed|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(
    causeChain(error),
  );
}
