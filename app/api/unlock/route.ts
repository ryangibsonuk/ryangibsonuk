import { NextRequest, NextResponse } from "next/server";
import { pinConfigured, unlockResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const pin = pinConfigured();
  if (!pin) return NextResponse.json({ ok: true });

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.pin !== pin) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  return unlockResponse(pin);
}
