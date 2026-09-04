import { NextRequest, NextResponse } from "next/server";
import { findAdminByEmail } from "@/lib/admins";
import { encodeSession, sessionCookieName } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: { email?: string; passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const requiredPasscode = process.env.APP_PASSCODE;
  if (requiredPasscode && body.passcode !== requiredPasscode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const admin = body.email ? findAdminByEmail(body.email) : undefined;
  if (!admin) {
    return NextResponse.json(
      { error: "That name isn't on the admin list." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), encodeSession(admin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
