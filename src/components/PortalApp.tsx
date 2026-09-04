"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, getCategoryById } from "@/config/categories";
import type { VideoLink } from "@/config/videoMapping";
import type { Admin } from "@/lib/admins";
import VideoCard from "./VideoCard";

type Step = "category" | "question" | "loading" | "answer" | "resolved" | "escalate" | "escalated";

type AskResponse = {
  caseId: string;
  answer: string | null;
  answerFailed: boolean;
  video: VideoLink;
};

export default function PortalApp({ admin }: { admin: Admin }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalationDetails, setEscalationDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  const categoryLabel = category ? getCategoryById(category)?.label : null;

  function resetToStart() {
    setStep("category");
    setCategory(null);
    setQuestion("");
    setResult(null);
    setError(null);
    setEscalationDetails("");
    setFeedbackNote(null);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handlePickCategory(id: string) {
    setCategory(id);
    setStep("question");
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !question.trim()) return;
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStep("question");
        return;
      }
      setResult(data);
      setStep("answer");
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again."
      );
      setStep("question");
    }
  }

  async function handleFeedback(helpful: boolean) {
    if (!result) return;
    setFeedbackNote(null);
    try {
      const res = await fetch(`/api/cases/${result.caseId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      const data = await res.json().catch(() => ({}));
      if (helpful) {
        setStep("resolved");
        if (res.ok && data.emailSent === false) {
          setFeedbackNote(
            "Your case was saved, but we couldn't email your lead automatically — they can still see it in the case history."
          );
        }
      } else {
        setStep("escalate");
      }
    } catch {
      // Even if the network call fails, still move the admin forward —
      // "No" should always lead to a way to reach a human.
      if (helpful) {
        setStep("resolved");
        setFeedbackNote(
          "Your case was saved, but we couldn't confirm the email went out."
        );
      } else {
        setStep("escalate");
      }
    }
  }

  async function handleEscalate(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${result.caseId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: escalationDetails }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.emailSent === false) {
        setFeedbackNote(
          "Your case was logged, but we couldn't email your lead automatically. They can still see it in the case history — try reaching out directly if it's urgent."
        );
      }
    } catch {
      setFeedbackNote(
        "Your case was logged locally, but we couldn't confirm the email went out. Try reaching out directly if it's urgent."
      );
    } finally {
      setSubmitting(false);
      setStep("escalated");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-brand-900 sm:text-xl">
            PowerSchool Support Portal
          </h1>
          <p className="text-sm text-gray-500">Hi {admin.name.split(" ")[0]} 👋</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin/cases" className="text-brand-700 underline">
            Case history
          </Link>
          <button onClick={handleLogout} className="text-gray-400 underline">
            Sign out
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
        {step === "category" && (
          <>
            <h2 className="text-base font-medium text-gray-900">
              What is this about?
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handlePickCategory(c.id)}
                  className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <span className="block text-sm font-medium text-gray-900">
                    {c.label}
                  </span>
                  {c.description && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {c.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {(step === "question" || step === "loading") && (
          <form onSubmit={handleAsk}>
            <button
              type="button"
              onClick={resetToStart}
              className="mb-3 text-sm text-gray-400"
            >
              ← Change category
            </button>
            <h2 className="text-base font-medium text-gray-900">
              {categoryLabel}
            </h2>
            <label htmlFor="question" className="mt-4 block text-sm font-medium text-gray-700">
              Describe your question or issue
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              placeholder="e.g. A student transferred mid-year and their attendance history isn't showing up on the new enrollment record."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              disabled={step === "loading"}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={step === "loading" || !question.trim()}
              className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {step === "loading" ? "Asking Claude…" : "Get help"}
            </button>
          </form>
        )}

        {step === "answer" && result && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {categoryLabel}
            </p>
            <p className="mt-1 text-sm text-gray-600">{question}</p>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              {result.answerFailed ? (
                <p className="text-sm text-red-600">
                  We couldn't get an answer from Claude right now
                  {error ? ` (${error})` : ""}. You can still connect with a
                  support engineer below.
                </p>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {result.answer}
                </p>
              )}
            </div>

            <div className="mt-4">
              <VideoCard video={result.video} />
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-sm font-medium text-gray-900">
                Was this helpful?
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleFeedback(true)}
                  className="flex-1 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800 transition hover:bg-green-100"
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="flex-1 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-800 transition hover:bg-orange-100"
                >
                  👎 No
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "resolved" && (
          <div className="text-center py-6">
            <p className="text-3xl">✅</p>
            <h2 className="mt-3 text-base font-medium text-gray-900">
              Glad that helped!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This case has been logged as resolved.
            </p>
            {feedbackNote && (
              <p className="mt-2 text-sm text-orange-600">{feedbackNote}</p>
            )}
            <button
              onClick={resetToStart}
              className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Ask another question
            </button>
          </div>
        )}

        {step === "escalate" && result && (
          <form onSubmit={handleEscalate}>
            <h2 className="text-base font-medium text-gray-900">
              Connect with a support engineer
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              We'll send your case to {admin ? "your PowerSchool lead" : "support"} —
              add any extra details that might help them (optional).
            </p>
            <textarea
              value={escalationDetails}
              onChange={(e) => setEscalationDetails(e.target.value)}
              rows={4}
              placeholder="Anything else worth knowing — what you already tried, error messages, student/section IDs, etc."
              className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send to support"}
            </button>
          </form>
        )}

        {step === "escalated" && (
          <div className="text-center py-6">
            <p className="text-3xl">📨</p>
            <h2 className="mt-3 text-base font-medium text-gray-900">
              Your case was sent
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your PowerSchool lead has been notified and will follow up with
              you directly.
            </p>
            {feedbackNote && (
              <p className="mt-2 text-sm text-orange-600">{feedbackNote}</p>
            )}
            <button
              onClick={resetToStart}
              className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
