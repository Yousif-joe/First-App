import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendResolvedEmail } from "@/lib/mailer";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { helpful?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.helpful !== "boolean") {
    return NextResponse.json({ error: "Missing helpful flag." }, { status: 400 });
  }

  const existing = await prisma.case.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const updated = await prisma.case.update({
    where: { id: params.id },
    data: {
      helpful: body.helpful,
      status: body.helpful ? "resolved" : "needs_follow_up",
    },
  });

  if (!body.helpful) {
    // "No" just unlocks the escalation form on the client — the email goes
    // out when they submit that form (see /api/cases/[id]/escalate).
    return NextResponse.json({ ok: true });
  }

  const emailResult = await sendResolvedEmail({
    adminName: updated.adminName,
    adminEmail: updated.adminEmail,
    category: updated.category,
    question: updated.question,
    answer: updated.answer,
    createdAt: updated.createdAt,
  });

  if (emailResult.ok) {
    await prisma.case.update({
      where: { id: params.id },
      data: { resolvedEmailSent: true },
    });
  }

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? null : emailResult.error,
  });
}
