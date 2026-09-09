import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "hq_auth";

function expectedToken(pin: string): string {
  return createHmac("sha256", pin).update("gibson-hq").digest("hex");
}

export function pinConfigured(): string {
  return process.env.DASHBOARD_PIN?.trim() ?? "";
}

export function isUnlocked(request: NextRequest): boolean {
  const pin = pinConfigured();
  if (!pin) return true;
  const cookie = request.cookies.get(COOKIE)?.value;
  if (!cookie) return false;
  const expected = expectedToken(pin);
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unlockResponse(pin: string): NextResponse {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE,
    value: expectedToken(pin),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export function lockResponse(): NextResponse {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
