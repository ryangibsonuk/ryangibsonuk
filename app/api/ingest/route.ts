import { NextRequest, NextResponse } from "next/server";
import { appendNote } from "@/lib/db";
import { parseIncomingEvent } from "@/lib/parse-event";

function authorized(request: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const alt = request.headers.get("x-hq-secret") ?? "";
  return token === secret || alt === secret;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized ingest" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  const saved = [];
  for (const item of items) {
    const parsed = parseIncomingEvent(item);
    if ("error" in parsed) {
      return NextResponse.json(parsed, { status: 400 });
    }
    saved.push(
      appendNote({
        source: parsed.source,
        project: parsed.project,
        title: parsed.title,
        detail: parsed.detail,
        url: parsed.url,
      }),
    );
  }

  return NextResponse.json({ ok: true, events: saved });
}

export async function GET() {
  return NextResponse.json({
    usage: {
      method: "POST",
      headers: { Authorization: "Bearer $INGEST_SECRET" },
      body: {
        source: "cursor | grok-bot | chatgpt | grok | github | life | manual",
        title: "What happened",
        project: "optional",
      },
    },
  });
}
