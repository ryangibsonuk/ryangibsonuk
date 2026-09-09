import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { pinConfigured, pinMatches, unlockResponse } from "@/lib/auth";
import {
  clearUnlockGuard,
  getUnlockGuard,
  saveUnlockGuard,
} from "@/lib/db";
import {
  checkUnlockGuard,
  recordUnlockFailure,
  unlockRetryMessage,
} from "@/lib/unlock-guard";

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

function lockedResponse(retryAfterSec: number) {
  return NextResponse.json(
    {
      error: unlockRetryMessage(retryAfterSec),
      retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

export async function POST(request: NextRequest) {
  const pin = pinConfigured();
  if (!pin) {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_OPEN_DASHBOARD !== "true"
    ) {
      return NextResponse.json(
        { error: "DASHBOARD_PIN is not set" },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const key = clientKey(request);
  const existing = getUnlockGuard(key);
  const now = Date.now();
  const locked = checkUnlockGuard(existing, now);
  if (!locked.allowed) return lockedResponse(locked.retryAfterSec);

  let body: { pin?: string } = {};
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!pinMatches(body.pin, pin)) {
    const next = recordUnlockFailure(existing, now);
    saveUnlockGuard(key, next);
    if (next.lockedUntil > now) {
      return lockedResponse(
        Math.max(1, Math.ceil((next.lockedUntil - now) / 1000)),
      );
    }
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  clearUnlockGuard(key);
  return unlockResponse(pin);
}
