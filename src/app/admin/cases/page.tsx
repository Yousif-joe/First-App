import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getCategoryById } from "@/config/categories";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function helpfulLabel(helpful: boolean | null): string {
  if (helpful === null) return "Pending";
  return helpful ? "Helpful" : "Not helpful";
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "resolved":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    case "escalated":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
    default:
      return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  }
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: { category?: string; helpful?: string };
}) {
  const admin = getSessionAdmin();
  if (!admin) {
    redirect("/login");
  }

  const categoryFilter = searchParams.category || "";
  const helpfulFilter = searchParams.helpful || "";

  const where: Prisma.CaseWhereInput = {};
  if (categoryFilter) where.category = categoryFilter;
  if (helpfulFilter === "yes") where.helpful = true;
  if (helpfulFilter === "no") where.helpful = false;
  if (helpfulFilter === "pending") where.helpful = null;

  const cases = await prisma.case.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  function buildHref(next: { category?: string; helpful?: string }) {
    const params = new URLSearchParams();
    const cat = next.category !== undefined ? next.category : categoryFilter;
    const hel = next.helpful !== undefined ? next.helpful : helpfulFilter;
    if (cat) params.set("category", cat);
    if (hel) params.set("helpful", hel);
    const qs = params.toString();
    return qs ? `/admin/cases?${qs}` : "/admin/cases";
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-brand-900 sm:text-xl">
            Case history
          </h1>
          <p className="text-sm text-gray-500">
            {cases.length} case{cases.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <Link href="/" className="text-sm text-brand-700 underline">
          ← Back to portal
        </Link>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Category:</span>
        <Link
          href={buildHref({ category: "" })}
          className={`rounded-full px-3 py-1 ${
            !categoryFilter ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={buildHref({ category: c.id })}
            className={`rounded-full px-3 py-1 ${
              categoryFilter === c.id
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Feedback:</span>
        {[
          { key: "", label: "All" },
          { key: "yes", label: "Helpful" },
          { key: "no", label: "Not helpful" },
          { key: "pending", label: "Pending" },
        ].map((opt) => (
          <Link
            key={opt.key}
            href={buildHref({ helpful: opt.key })}
            className={`rounded-full px-3 py-1 ${
              helpfulFilter === opt.key
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {cases.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
            No cases match these filters yet.
          </p>
        )}
        {cases.map((c) => (
          <div
            key={c.id}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {getCategoryById(c.category)?.label ?? c.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(
                    c.status
                  )}`}
                >
                  {c.status}
                </span>
                <span className="text-xs text-gray-400">
                  {helpfulLabel(c.helpful)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {c.createdAt.toLocaleString("en-US")}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-gray-900">
              {c.adminName}
              <span className="ml-1 font-normal text-gray-400">
                ({c.adminEmail})
              </span>
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {c.question}
            </p>

            {c.answer && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-brand-700">
                  View Claude's answer
                </summary>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {c.answer}
                </p>
              </details>
            )}
            {!c.answer && c.answerError && (
              <p className="mt-2 text-sm text-red-600">
                Claude call failed: {c.answerError}
              </p>
            )}

            {c.escalationDetails && (
              <p className="mt-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                <b>Escalation details:</b> {c.escalationDetails}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
