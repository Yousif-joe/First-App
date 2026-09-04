"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Admin } from "@/lib/admins";

export default function LoginForm({
  admins,
  passcodeRequired,
}: {
  admins: Admin[];
  passcodeRequired: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(admins[0]?.email ?? "");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't sign you in. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="admin" className="block text-sm font-medium text-gray-700">
          Your name
        </label>
        <select
          id="admin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {admins.map((a) => (
            <option key={a.email} value={a.email}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {passcodeRequired && (
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
            Team passcode
          </label>
          <input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoComplete="current-password"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Continue"}
      </button>
    </form>
  );
}
