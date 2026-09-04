import Anthropic from "@anthropic-ai/sdk";
import { getCategoryById } from "@/config/categories";

const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function buildSystemPrompt(category: string): string {
  const cat = getCategoryById(category);
  const categoryLabel = cat?.label ?? category;

  return `You are a PowerSchool SIS (Student Information System) support expert embedded in an internal help desk for a school district's PowerSchool admin team. You are answering a question from one of the district's own PowerSchool admins, filed under the category "${categoryLabel}".

Rules for your answer:
1. Give clear, numbered steps describing exactly where to click in PowerSchool: which screen/page (e.g. "System > Attendance > Attendance Codes"), which tab, and which field or button. Write for someone who already has PowerSchool open and needs the click-path, not background theory.
2. Be concise. This is a working admin who wants the fix, not an essay — a few tight steps beat a long explanation. Skip preamble; get straight to the steps.
3. If the answer depends on a district-specific configuration you cannot know (custom page codes, a locally-renamed field, a specific board policy, a locally built report, permissions specific to this district's setup), say so explicitly instead of guessing — name exactly what you don't know and suggest who/where to confirm it (e.g. "check with your PowerSchool systems admin for the exact code your district uses here").
4. If the question is ambiguous, briefly state the assumption you're making and proceed — don't just ask a clarifying question with no attempt at an answer.
5. Only cover the standard PowerSchool SIS product (the admin/back-office side, PowerTeacher, PowerSchool state reporting) — do not invent features that don't exist in PowerSchool.
6. Format with a short numbered list. Use a brief bold label per step if it helps scanning. No long intro or closing paragraph.`;
}

export type AskClaudeResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export async function askClaude(
  category: string,
  question: string
): Promise<AskClaudeResult> {
  try {
    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(category),
      messages: [{ role: "user", content: question }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const answer = textBlock && "text" in textBlock ? textBlock.text : "";

    if (!answer) {
      return { ok: false, error: "Claude returned an empty response." };
    }

    return { ok: true, answer };
  } catch (err) {
    console.error("[anthropic] askClaude failed:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error calling Claude";
    return { ok: false, error: message };
  }
}
