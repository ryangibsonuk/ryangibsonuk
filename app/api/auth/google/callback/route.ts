import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, googleClient } from "@/lib/google";
import { readOAuthState } from "@/lib/oauth-state";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/teammates?google=error&reason=${encodeURIComponent(error)}`,
        request.url,
      ),
    );
  }
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const parsed = readOAuthState(state);
  if (!code || !parsed) {
    return NextResponse.redirect(new URL("/teammates?google=error", request.url));
  }
  try {
    await exchangeGoogleCode(
      code,
      parsed.redirectUri || googleClient().redirectUri,
    );
    return NextResponse.redirect(
      new URL("/teammates?google=connected", request.url),
    );
  } catch (cause) {
    console.error(cause);
    return NextResponse.redirect(new URL("/teammates?google=error", request.url));
  }
}
