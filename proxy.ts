import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const hasSession = Boolean(request.cookies.get("cafe_moon_session")?.value);

  if (!isLoginPage && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginPage && hasSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
