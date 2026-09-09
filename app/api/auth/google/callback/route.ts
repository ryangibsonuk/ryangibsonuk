import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, googleClient } from "@/lib/google";
import { readOAuthState } from "@/lib/oauth-state";
import { originFromHeaders } from "@/lib/origin";

export const runtime = "nodejs";

function teammatesUrl(request: NextRequest, query: string) {
  return new URL(`/teammates?${query}`, `${originFromHeaders(request.headers)}/`);
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      teammatesUrl(request, `google=error&reason=${encodeURIComponent(error)}`),
    );
  }
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const parsed = readOAuthState(state);
  if (!code || !parsed) {
    return NextResponse.redirect(teammatesUrl(request, "google=error"));
  }
  try {
    await exchangeGoogleCode(
      code,
      parsed.redirectUri || googleClient().redirectUri,
    );
    return NextResponse.redirect(teammatesUrl(request, "google=connected"));
  } catch (cause) {
    console.error(cause);
    return NextResponse.redirect(teammatesUrl(request, "google=error"));
  }
}
