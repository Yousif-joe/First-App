import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/session";
import { getCategoryById } from "@/config/categories";
import { getVideoForQuestion } from "@/config/videoMapping";
import { askClaude } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const admin = getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { category?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const category = body.category?.trim();
  const question = body.question?.trim();

  if (!category || !getCategoryById(category)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json(
      { error: "Please describe your question." },
      { status: 400 }
    );
  }

  const result = await askClaude(category, question);
  const video = getVideoForQuestion(category, question);

  const caseRecord = await prisma.case.create({
    data: {
      adminName: admin.name,
      adminEmail: admin.email,
      category,
      question,
      answer: result.ok ? result.answer : null,
      answerError: result.ok ? null : result.error,
    },
  });

  return NextResponse.json({
    caseId: caseRecord.id,
    answer: result.ok ? result.answer : null,
    answerFailed: !result.ok,
    video,
  });
}
