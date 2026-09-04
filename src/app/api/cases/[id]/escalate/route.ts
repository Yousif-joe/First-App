import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendEscalationEmail } from "@/lib/mailer";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { details?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const existing = await prisma.case.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const details = body.details?.trim() || null;

  const updated = await prisma.case.update({
    where: { id: params.id },
    data: {
      escalated: true,
      escalationDetails: details,
      status: "escalated",
      helpful: false,
    },
  });

  const emailResult = await sendEscalationEmail({
    adminName: updated.adminName,
    adminEmail: updated.adminEmail,
    category: updated.category,
    question: updated.question,
    answer: updated.answer,
    createdAt: updated.createdAt,
    escalationDetails: updated.escalationDetails,
  });

  if (emailResult.ok) {
    await prisma.case.update({
      where: { id: params.id },
      data: { escalationEmailSent: true },
    });
  }

  // Always confirm to the admin that their case is logged, even if the
  // email failed — the case history at /admin/cases still has it, and the
  // support lead can review it there.
  return NextResponse.json({
    ok: true,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? null : emailResult.error,
  });
}
