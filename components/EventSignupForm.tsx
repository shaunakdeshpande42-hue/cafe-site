"use client";

import { useState } from "react";

interface Props {
  eventId: string;
  eventTitle: string;
  eventDate: string;
}

export default function EventSignupForm({ eventId, eventTitle, eventDate }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setState("loading");
    setErrorMsg("");

    const res = await fetch("/api/events/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, eventTitle, eventDate, name, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || "Something went wrong.");
      setState("error");
      return;
    }

    setState("success");
  }

  if (state === "success") {
    return (
      <div className="bg-burgundy px-8 py-10 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-blush flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-blush">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l4 4 7-8" />
          </svg>
        </div>
        <p className="font-serif text-2xl text-cream">You&apos;re in!</p>
        <p className="text-cream/70 font-sans text-sm leading-relaxed">
          A confirmation email is on its way to <strong className="text-cream">{email}</strong>.
          We look forward to seeing you.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cream-dark border border-cream-dark px-8 py-8 flex flex-col gap-5">
      <div>
        <h3 className="font-serif text-xl text-charcoal">Reserve your spot</h3>
        <p className="text-xs font-sans text-charcoal/50 mt-1">
          Free to attend · Confirmation sent by email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
          />
        </div>

        {state === "error" && (
          <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 border border-red-200">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? "Saving your spot…" : "Sign Me Up"}
        </button>
      </form>
    </div>
  );
}
