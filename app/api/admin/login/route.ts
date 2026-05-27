import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";
const SEVEN_DAYS_SEC = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: password,
    path: "/",
    maxAge: SEVEN_DAYS_SEC,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // not httpOnly: the existing admin UI reads this to send x-admin-password
    // on subsequent fetches. /admin is middleware-gated so the XSS surface
    // here is essentially zero (no user-generated HTML rendered on /admin).
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
