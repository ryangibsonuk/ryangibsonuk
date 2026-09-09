import { NextRequest, NextResponse } from "next/server";
import { chatGrok, type ChatMessage } from "@/lib/grok";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body as { messages?: ChatMessage[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages[] is required" }, { status: 400 });
  }

  const trimmed = messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 8000),
    }))
    .slice(-20);

  try {
    const result = await chatGrok(trimmed);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grok failed";
    const status = message.includes("XAI_API_KEY") ? 501 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
