import { NextRequest, NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/google";
import { signOAuthState } from "@/lib/oauth-state";
import { googleCallbackUrl, originFromHeaders } from "@/lib/origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first." },
      { status: 501 },
    );
  }
  const redirect = googleCallbackUrl(originFromHeaders(request.headers));
  return NextResponse.redirect(
    googleAuthUrl(signOAuthState({ redirectUri: redirect }), redirect),
  );
}
