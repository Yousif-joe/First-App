// ---------------------------------------------------------------------------
// Minimal session handling for the 5-admin login gate.
//
// This is deliberately lightweight (no NextAuth/OAuth, per spec): an admin
// picks their name from ADMIN_LIST (+ an optional shared passcode, if
// APP_PASSCODE is set), and we drop a signed cookie identifying them. Every
// server action/API route reads that cookie to know "who is asking" for the
// case record and email.
// ---------------------------------------------------------------------------

import { cookies } from "next/headers";
import crypto from "crypto";
import { Admin, findAdminByEmail } from "./admins";

const COOKIE_NAME = "ps_admin_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret";

type SessionPayload = {
  name: string;
  email: string;
};

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function encode(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

function decode(token: string): SessionPayload | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  if (sign(b64) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function getSessionAdmin(): Admin | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  // Re-validate against the current admin list in case it changed.
  const admin = findAdminByEmail(payload.email);
  if (!admin) return null;
  return admin;
}

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

export function encodeSession(admin: Admin): string {
  return encode({ name: admin.name, email: admin.email });
}
