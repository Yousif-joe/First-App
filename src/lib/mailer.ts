import nodemailer from "nodemailer";
import { getCategoryById } from "@/config/categories";

// ---------------------------------------------------------------------------
// SMTP mailer for case notification emails to the support lead.
//
// Configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// SUPPORT_LEAD_EMAIL (defaults to yousif.jawad@alsamaproject.com).
//
// Note: if the district is on Microsoft 365, the mailbox used for SMTP_USER
// may need "Authenticated SMTP" enabled (it's off by default on many M365
// tenants) — see the README for the Exchange admin center steps, or swap
// this module for Microsoft Graph's sendMail API later if SMTP AUTH is
// blocked by tenant policy.
// ---------------------------------------------------------------------------

const DEFAULT_SUPPORT_LEAD_EMAIL = "yousif.jawad@alsamaproject.com";

export function getSupportLeadEmail(): string {
  return process.env.SUPPORT_LEAD_EMAIL || DEFAULT_SUPPORT_LEAD_EMAIL;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP is not configured (need SMTP_HOST, SMTP_USER, SMTP_PASS)"
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function shortQuestion(question: string, maxLen = 60): string {
  const trimmed = question.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 1) + "…" : trimmed;
}

type CaseEmailInput = {
  adminName: string;
  adminEmail: string;
  category: string;
  question: string;
  answer: string | null;
  createdAt: Date;
};

function baseCaseHtml(input: CaseEmailInput, extra?: string): string {
  const categoryLabel = getCategoryById(input.category)?.label ?? input.category;
  return `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 600px;">
      <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding:4px 0; color:#555;">Admin</td><td style="padding:4px 0;"><b>${escapeHtml(input.adminName)}</b> (${escapeHtml(input.adminEmail)})</td></tr>
        <tr><td style="padding:4px 0; color:#555;">Category</td><td style="padding:4px 0;"><b>${escapeHtml(categoryLabel)}</b></td></tr>
        <tr><td style="padding:4px 0; color:#555;">Submitted</td><td style="padding:4px 0;">${input.createdAt.toLocaleString("en-US")}</td></tr>
      </table>
      <p style="color:#555; margin-bottom:4px;"><b>Question</b></p>
      <p style="white-space:pre-wrap; background:#f5f5f7; padding:12px; border-radius:8px;">${escapeHtml(input.question)}</p>
      <p style="color:#555; margin-bottom:4px;"><b>Claude's answer</b></p>
      <p style="white-space:pre-wrap; background:#f5f5f7; padding:12px; border-radius:8px;">${
        input.answer ? escapeHtml(input.answer) : "<i>(No answer was generated — the Claude API call failed.)</i>"
      }</p>
      ${extra ?? ""}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export async function sendResolvedEmail(
  input: CaseEmailInput
): Promise<SendEmailResult> {
  const categoryLabel = getCategoryById(input.category)?.label ?? input.category;
  const subject = `[PS Support] Resolved: ${categoryLabel} - ${shortQuestion(input.question)}`;
  return sendMail(subject, baseCaseHtml(input));
}

export async function sendEscalationEmail(
  input: CaseEmailInput & { escalationDetails?: string | null }
): Promise<SendEmailResult> {
  const categoryLabel = getCategoryById(input.category)?.label ?? input.category;
  const subject = `[PS Support] ESCALATION NEEDED: ${categoryLabel} - ${shortQuestion(input.question)}`;
  const extra = input.escalationDetails
    ? `<p style="color:#555; margin-bottom:4px;"><b>Extra details from the admin</b></p>
       <p style="white-space:pre-wrap; background:#fff4e5; padding:12px; border-radius:8px;">${escapeHtml(input.escalationDetails)}</p>`
    : `<p style="color:#888;"><i>The admin marked Claude's answer as not helpful and did not add extra details.</i></p>`;
  return sendMail(subject, baseCaseHtml(input, extra));
}

async function sendMail(subject: string, html: string): Promise<SendEmailResult> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.SMTP_USER,
      to: getSupportLeadEmail(),
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { ok: false, error: message };
  }
}
