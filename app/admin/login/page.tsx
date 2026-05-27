"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        setSubmitting(false);
        return;
      }
      const dest = params.get("from") || "/admin";
      router.replace(dest);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm flex flex-col gap-6 p-8 border border-charcoal/10 bg-white"
    >
      <div className="text-center">
        <p className="text-xs tracking-widest uppercase text-burgundy font-sans">EM Patisserie</p>
        <h1 className="font-serif text-2xl text-charcoal mt-1">Staff Sign-in</h1>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-widest uppercase text-charcoal/60 font-sans">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          className="border border-charcoal/20 px-3 py-2 font-sans text-sm focus:outline-none focus:border-burgundy"
        />
      </label>

      {error && (
        <p className="text-sm text-rose-700 font-sans">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !password}
        className="px-6 py-3 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200 disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
