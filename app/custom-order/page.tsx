"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";

// ── Options ───────────────────────────────────────────────────────────────

const OCCASIONS = [
  "Birthday",
  "Wedding / Engagement",
  "Anniversary",
  "Baby Shower",
  "Christening / Naming Ceremony",
  "Corporate Event",
  "Other",
];

const SERVES_OPTIONS = [
  "Up to 8 people (6\")",
  "10–15 people (8\")",
  "15–20 people (10\")",
  "20–30 people (12\")",
  "30+ people / Multi-tier",
  "Not sure — please suggest",
];

const FLAVOUR_OPTIONS = [
  "Dark Chocolate",
  "Milk Chocolate",
  "Vanilla Bean",
  "Red Velvet",
  "Caramel & Sea Salt",
  "Coffee",
  "Lemon",
  "Mixed Berries",
  "Open to suggestions",
];

const DIETARY_OPTIONS = ["Eggless", "Vegan", "Gluten-Free", "Nut-Free"];

const BUDGET_OPTIONS = [
  "Under ₹1,500",
  "₹1,500 – ₹3,000",
  "₹3,000 – ₹5,000",
  "₹5,000 – ₹10,000",
  "Above ₹10,000",
  "Flexible",
];

const PICKUP_SLOTS = [
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
];

// ── Helpers ───────────────────────────────────────────────────────────────

// Minimum 5 days from today for custom orders
function minPickupDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10);
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 11) return "+91" + digits.slice(1);
  return raw;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CustomOrderPage() {
  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Occasion
  const [occasion, setOccasion] = useState("");
  const [occasionOther, setOccasionOther] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState("");

  // The cake
  const [serves, setServes] = useState("");
  const [flavors, setFlavors] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [messageOnCake, setMessageOnCake] = useState("");

  // Design
  const [designDescription, setDesignDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleArray(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
    if (!phone.trim() || !/^(\+91|0)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) e.phone = "Please enter a valid Indian phone number.";
    if (!occasion) e.occasion = "Please select an occasion.";
    if (occasion === "Other" && !occasionOther.trim()) e.occasionOther = "Please describe the occasion.";
    if (!pickupDate) e.pickupDate = "Please select a pickup date.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email,
          phone: normalisePhone(phone),
          occasion, occasionOther,
          pickupDate, pickupTimeSlot,
          serves,
          flavors: flavors.join(", ") || null,
          dietary: dietary.join(", ") || null,
          messageOnCake, designDescription,
          referenceImageUrl, budgetRange, additionalNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ form: data.error ?? "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="pt-20 min-h-screen bg-cream flex items-center justify-center px-6">
        <FadeIn className="max-w-md mx-auto text-center flex flex-col items-center gap-6 py-20">
          <div className="w-16 h-16 bg-burgundy/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-burgundy">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-3xl text-charcoal mb-3">Enquiry Received</h1>
            <p className="font-sans text-charcoal/60 text-base leading-relaxed">
              Thank you, <span className="text-charcoal font-medium">{name}</span>. We&rsquo;ve received your
              custom cake enquiry and will get back to you within <strong>24–48 hours</strong> to
              confirm details and discuss the design.
            </p>
          </div>
          <p className="font-sans text-sm text-charcoal/40">
            A confirmation has been sent to <span className="text-charcoal/60">{email}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/"
              className="px-8 py-3 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/menu"
              className="px-8 py-3 border border-burgundy text-burgundy text-xs tracking-widest uppercase font-sans hover:bg-burgundy hover:text-cream transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-cream min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative h-72 sm:h-96 flex items-end overflow-hidden">
        <Image
          src="/gallery/13.webp"
          alt="Custom cakes at EM Patisserie"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-charcoal/10" />
        <div className="relative z-10 px-6 pb-10 sm:pb-14 max-w-4xl mx-auto w-full">
          <p className="text-xs tracking-widest uppercase text-blush font-sans mb-2">Made to order</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream leading-tight">
            Custom Cake Orders
          </h1>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="bg-charcoal py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Share your vision", desc: "Fill in the form with your occasion, design ideas, and any reference images." },
            { step: "02", title: "We'll be in touch", desc: "Our team reviews your request and gets back to you within 24–48 hours to confirm all details." },
            { step: "03", title: "Pick up your creation", desc: "Collect your custom cake at your preferred time, beautifully packaged and ready to celebrate." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <span className="font-serif text-3xl text-burgundy/60 leading-none shrink-0">{step}</span>
              <div>
                <p className="font-serif text-base text-cream mb-1">{title}</p>
                <p className="font-sans text-sm text-cream/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Notice bar ────────────────────────────────────────────────── */}
      <div className="bg-burgundy/10 border-y border-burgundy/20 px-6 py-3">
        <p className="max-w-4xl mx-auto text-sm font-sans text-burgundy text-center">
          Custom cakes require a minimum of <strong>5 days&rsquo; notice</strong>. For urgent requests, please call us directly.
        </p>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <section className="py-14 px-6">
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto flex flex-col gap-12">

          {/* ── Section: Contact ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-6">
            <SectionHeader number="1" title="About You" />

            <Field label="Full Name" required error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={inputCls(!!errors.name)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={inputCls(!!errors.phone)}
                />
              </Field>
            </div>
          </fieldset>

          {/* ── Section: Occasion ─────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-6">
            <SectionHeader number="2" title="The Occasion" />

            <Field label="Occasion" required error={errors.occasion}>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className={selectCls(!!errors.occasion)}
              >
                <option value="">Select an occasion…</option>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>

            {occasion === "Other" && (
              <Field label="Please describe the occasion" required error={errors.occasionOther}>
                <input
                  type="text"
                  value={occasionOther}
                  onChange={(e) => setOccasionOther(e.target.value)}
                  placeholder="e.g. Retirement party, Festival celebration…"
                  className={inputCls(!!errors.occasionOther)}
                />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Preferred Pickup Date" required error={errors.pickupDate} hint="Minimum 5 days from today">
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={minPickupDate()}
                  className={inputCls(!!errors.pickupDate)}
                />
              </Field>
              <Field label="Preferred Pickup Time" hint="Optional — we'll confirm">
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className={selectCls(false)}
                >
                  <option value="">Any time is fine</option>
                  {PICKUP_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>

          {/* ── Section: The Cake ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-6">
            <SectionHeader number="3" title="The Cake" />

            <Field label="Serves (approx.)">
              <select
                value={serves}
                onChange={(e) => setServes(e.target.value)}
                className={selectCls(false)}
              >
                <option value="">Select a size…</option>
                {SERVES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Flavour Preference" hint="Select all that apply">
              <div className="flex flex-wrap gap-2 mt-1">
                {FLAVOUR_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleArray(flavors, setFlavors, f)}
                    className={`text-xs font-sans px-3 py-1.5 border transition-colors ${
                      flavors.includes(f)
                        ? "bg-burgundy text-cream border-burgundy"
                        : "border-charcoal/20 text-charcoal/60 hover:border-burgundy hover:text-burgundy"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Dietary Requirements" hint="Select all that apply">
              <div className="flex flex-wrap gap-2 mt-1">
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleArray(dietary, setDietary, d)}
                    className={`text-xs font-sans px-3 py-1.5 border transition-colors ${
                      dietary.includes(d)
                        ? "bg-charcoal text-cream border-charcoal"
                        : "border-charcoal/20 text-charcoal/60 hover:border-charcoal hover:text-charcoal"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Message on Cake" hint={`${messageOnCake.length}/50 characters`}>
              <input
                type="text"
                value={messageOnCake}
                onChange={(e) => setMessageOnCake(e.target.value.slice(0, 50))}
                placeholder="e.g. Happy Birthday Priya! 🎂"
                className={inputCls(false)}
              />
            </Field>
          </fieldset>

          {/* ── Section: Design & Details ─────────────────────────────── */}
          <fieldset className="flex flex-col gap-6">
            <SectionHeader number="4" title="Design & Details" />

            <Field label="Design Description" hint="Describe the look, colours, style, or any theme you have in mind">
              <textarea
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="e.g. Soft pastel floral design with gold leaf accents. Rustic drip finish in dark chocolate…"
                rows={4}
                className={`${inputCls(false)} resize-none`}
              />
            </Field>

            <Field label="Reference Image URL" hint="Paste a link from Pinterest, Instagram, or Google Images (optional)">
              <input
                type="url"
                value={referenceImageUrl}
                onChange={(e) => setReferenceImageUrl(e.target.value)}
                placeholder="https://pinterest.com/..."
                className={inputCls(false)}
              />
            </Field>

            <Field label="Budget Range">
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className={selectCls(false)}
              >
                <option value="">Prefer not to say / not sure</option>
                {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Anything else we should know?" hint="Allergies, special requests, delivery details…">
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any other details that will help us create the perfect cake for you…"
                rows={3}
                className={`${inputCls(false)} resize-none`}
              />
            </Field>
          </fieldset>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          {errors.form && (
            <p className="text-sm font-sans text-red-600 bg-red-50 border border-red-200 px-4 py-3">
              {errors.form}
            </p>
          )}

          <div className="flex flex-col gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Send Enquiry"
              )}
            </button>
            <p className="text-center text-xs font-sans text-charcoal/35 leading-relaxed">
              Submitting this form is not a confirmed order — our team will contact you
              within 24–48 hours to finalise details and pricing.
            </p>
          </div>

        </form>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 pb-2 border-b border-cream-dark">
      <span className="font-serif text-2xl text-burgundy/40 leading-none">{number}</span>
      <h2 className="font-serif text-xl text-charcoal">{title}</h2>
    </div>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
        {label}
        {required && <span className="text-burgundy ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] font-sans text-charcoal/35">{hint}</p>}
      {error && <p className="text-xs font-sans text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `border ${hasError ? "border-red-300 bg-red-50/30" : "border-cream-dark bg-white"} px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors`;
}

function selectCls(hasError: boolean) {
  return `border ${hasError ? "border-red-300 bg-red-50/30" : "border-cream-dark bg-white"} px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors appearance-none cursor-pointer`;
}
