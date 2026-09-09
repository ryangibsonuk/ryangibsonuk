import { NextRequest, NextResponse } from "next/server";
import { isUnlocked, pinConfigured } from "./lib/auth";

function pinMissingInProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_OPEN_DASHBOARD !== "true" &&
    !pinConfigured()
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pinMissingInProduction()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "DASHBOARD_PIN is not set" },
        { status: 503 },
      );
    }
    return new NextResponse(
      "Set DASHBOARD_PIN on the host before using Gibson HQ.",
      {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  }

  if (!pinConfigured()) return NextResponse.next();

  if (
    pathname.startsWith("/unlock") ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/integrations") ||
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/v1/register") ||
    pathname.startsWith("/api/auth/google/callback")
  ) {
    return NextResponse.next();
  }

  if (isUnlocked(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
