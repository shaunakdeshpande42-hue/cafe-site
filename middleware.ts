import { NextRequest, NextResponse } from "next/server";

// Gate /admin and its subpaths behind a session cookie.
// /admin/login is the only admin path reachable without a cookie.
//
// The cookie value equals ADMIN_PASSWORD. It's set by /api/admin/login
// after the user types the password correctly. We compare here to the
// env var so a stale cookie (after rotating the password) is rejected.

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(req: NextRequest) {
  // Allow the login page itself
  if (req.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = req.cookies.get("admin_session")?.value;
  if (session && session === process.env.ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
