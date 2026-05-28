"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import FadeIn from "@/components/FadeIn";
import PickupCalendar from "@/components/PickupCalendar";

// ─── Country dial codes ───────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+39",  flag: "🇮🇹", name: "Italy" },
  { code: "+34",  flag: "🇪🇸", name: "Spain" },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "+41",  flag: "🇨🇭", name: "Switzerland" },
  { code: "+46",  flag: "🇸🇪", name: "Sweden" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
];

// ─── Date helpers ────────────────────────────────────────────────────────────

/** ISO date-only string: "2026-05-23" */
function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

// ─── Time-slot helpers ────────────────────────────────────────────────────────

function generateSlots(dateKey: string): string[] {
  const slots: string[] = [];
  const [year, month, day] = dateKey.split("-").map(Number);

  const isToday = dateKey === toDateKey(new Date());

  let startH: number, startM: number;
  if (isToday) {
    const now = new Date();
    const totalMins = now.getHours() * 60 + now.getMinutes() + 30;
    const rounded = Math.ceil(totalMins / 15) * 15;
    startH = Math.floor(rounded / 60);
    startM = rounded % 60;
  } else {
    startH = 9;
    startM = 0;
  }

  const cursor = new Date(year, month - 1, day, startH, startM, 0, 0);
  const end    = new Date(year, month - 1, day, 21, 0, 0, 0);

  while (cursor <= end) {
    slots.push(cursor.toISOString());
    cursor.setMinutes(cursor.getMinutes() + 15);
  }
  return slots;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Razorpay types ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string; amount: number; currency: string;
  name: string; description: string; order_id: string;
  handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
}
interface RazorpayInstance { open(): void }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const router = useRouter();
  const { items, total, clearCart, updateQuantity, removeItem } = useCartStore();

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone]           = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dialCode, setDialCode]     = useState("+91");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Date & time state
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDateKey, setDateKey]  = useState(toDateKey(today));
  const [slots, setSlots]              = useState<string[]>([]);
  const [pickupTime, setPickupTime]    = useState("");

  // Payment method
  const razorpayReady =
    !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== "rzp_test_REPLACE_ME";
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">(
    razorpayReady ? "online" : "cash"
  );

  // Regenerate slots whenever the date changes
  useEffect(() => {
    const newSlots = generateSlots(selectedDateKey);
    setSlots(newSlots);
    setPickupTime(newSlots[0] ?? "");
  }, [selectedDateKey]);

  // Load Razorpay script once
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  const orderTotal = total();

  // Full international phone number sent to APIs
  const fullPhone = phone.trim()
    ? `${dialCode}${phone.replace(/^0/, "").replace(/[\s\-()]/g, "")}`
    : "";

  // Inline validation computeds
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneDigits = phone.replace(/[\s\-()]/g, "").replace(/^0/, "");
  const phoneValid = phone.trim() !== "" && (
    dialCode === "+91" ? /^[6-9]\d{9}$/.test(phoneDigits) : /^\d{7,15}$/.test(phoneDigits)
  );

  // All required fields filled + valid + cart non-empty + slots available
  const formComplete =
    name.trim() !== "" &&
    email.trim() !== "" &&
    emailValid &&
    phone.trim() !== "" &&
    phoneValid &&
    pickupTime !== "" &&
    items.length > 0 &&
    slots.length > 0 &&
    consentGiven;

  // ── validation ──────────────────────────────────────────────────────────────
  function validate() {
    if (!name.trim() || !email.trim() || !phone.trim() || !pickupTime) {
      setError("Please fill in all fields."); return false;
    }
    if (!emailValid) {
      setError("Please enter a valid email address."); return false;
    }
    if (!phoneValid) {
      setError(
        dialCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number."
          : "Please enter a valid phone number (7–15 digits)."
      ); return false;
    }
    if (items.length === 0) {
      setError("Your cart is empty."); return false;
    }
    setError(""); return true;
  }

  // ── cash / test order ────────────────────────────────────────────────────────
  async function handleCashOrder() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name, customerEmail: email, customerPhone: fullPhone,
          pickupTime, items, total: orderTotal, paymentMethod: "cash",
          specialInstructions: specialInstructions.trim() || null,
        }),
      });
      const { orderId, error: e } = await res.json();
      if (e) throw new Error(e);
      clearCart();
      router.push(`/order/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally { setLoading(false); }
  }

  // ── Razorpay payment ─────────────────────────────────────────────────────────
  async function handlePayment() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderTotal * 100 }),
      });
      const { orderId, error: e } = await res.json();
      if (e) throw new Error(e);

      new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderTotal * 100,
        currency: "INR",
        name: "EM Patisserie",
        description: "Order from EM Patisserie & Artisanal Chocolates",
        order_id: orderId,
        handler: async (response) => {
          const vr = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              customerName: name, customerEmail: email, customerPhone: fullPhone,
              pickupTime, items, total: orderTotal,
              specialInstructions: specialInstructions.trim() || null,
            }),
          });
          const { orderId: saved, error: ve } = await vr.json();
          if (ve) throw new Error(ve);
          clearCart();
          router.push(`/order/${saved}`);
        },
        prefill: { name, email, contact: fullPhone },
        theme: { color: "#6B1830" },
      }).open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally { setLoading(false); }
  }

  // ── test-mode online order ───────────────────────────────────────────────────
  async function handleTestOrder() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name, customerEmail: email, customerPhone: fullPhone,
          pickupTime, items, total: orderTotal, paymentMethod: "online",
          specialInstructions: specialInstructions.trim() || null,
        }),
      });
      const { orderId, error: e } = await res.json();
      if (e) throw new Error(e);
      clearCart();
      router.push(`/order/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally { setLoading(false); }
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pt-20 bg-cream min-h-screen">
      <div className="bg-blush-light py-16 px-6 text-center">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">Almost there</p>
          <h1 className="font-serif text-4xl text-charcoal">Checkout</h1>
        </FadeIn>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* ── Order summary ── */}
        <FadeIn>
          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-6">Your Order</h2>
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-10 text-center border border-dashed border-cream-dark bg-cream/50">
                <span className="text-5xl leading-none">🛒</span>
                <div>
                  <p className="font-serif text-xl text-charcoal/60">Your cart is empty</p>
                  <p className="text-sm font-sans text-charcoal/35 mt-1">
                    Add something delicious to get started.
                  </p>
                </div>
                <Link
                  href="/menu"
                  className="px-7 py-2.5 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200"
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-cream-dark">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base text-charcoal leading-snug">{item.name}</p>
                      <p className="text-xs text-charcoal/50 font-sans mt-0.5">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-cream-dark">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-burgundy hover:bg-cream-dark transition-colors font-sans text-base leading-none"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-sans text-sm text-charcoal select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-burgundy hover:bg-cream-dark transition-colors font-sans text-base leading-none"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      {/* Price */}
                      <span className="w-16 text-right text-sm font-sans text-burgundy">
                        ₹{item.price * item.quantity}
                      </span>
                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-charcoal/25 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between items-center pt-5 border-t border-cream-dark mt-2">
              <span className="text-xs tracking-widest uppercase font-sans text-charcoal/60">Total</span>
              <span className="font-serif text-2xl text-charcoal">₹{orderTotal}</span>
            </div>
          </div>
        </FadeIn>

        {/* ── Customer details ── */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-5">
            <h2 className="font-serif text-2xl text-charcoal">Your Details</h2>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Name <span className="text-burgundy">*</span>
              </label>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Email <span className="text-burgundy">*</span>
              </label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                onBlur={() => setEmailTouched(true)}
                placeholder="your@email.com"
                className={`border bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none transition-colors ${
                  emailTouched && email.trim() && !emailValid
                    ? "border-red-400 focus:border-red-400"
                    : "border-cream-dark focus:border-burgundy"
                }`}
              />
              {emailTouched && email.trim() !== "" && !emailValid && (
                <p className="text-[11px] font-sans text-red-500">Please enter a valid email address</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Phone <span className="text-burgundy">*</span>
              </label>
              <div className="flex">
                <select
                  value={dialCode}
                  onChange={(e) => { setDialCode(e.target.value); setPhone(""); setPhoneTouched(false); }}
                  className="border border-r-0 border-cream-dark bg-cream-dark px-2 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors cursor-pointer"
                  style={{ minWidth: "5.5rem" }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code + c.name} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder={dialCode === "+91" ? "98765 43210" : "Phone number"}
                  maxLength={16}
                  className={`flex-1 border bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none transition-colors ${
                    phoneTouched && phone.trim() && !phoneValid
                      ? "border-red-400 focus:border-red-400"
                      : "border-cream-dark focus:border-burgundy"
                  }`}
                />
              </div>
              {phoneTouched && phone.trim() !== "" && !phoneValid ? (
                <p className="text-[11px] font-sans text-red-500">
                  {dialCode === "+91" ? "Enter a valid 10-digit Indian mobile number" : "Enter a valid phone number (7–15 digits)"}
                </p>
              ) : (
                <p className="text-[11px] font-sans text-charcoal/35">You&apos;ll receive order updates via SMS</p>
              )}
            </div>

            {/* Pickup date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Pickup Date <span className="text-burgundy">*</span>
              </label>
              <PickupCalendar
                selectedDateKey={selectedDateKey}
                onChange={setDateKey}
                daysAhead={14}
              />
            </div>

            {/* Pickup time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Pickup Time <span className="text-burgundy">*</span>
              </label>
              {slots.length > 0 ? (
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                >
                  {slots.map((s) => (
                    <option key={s} value={s}>{formatTime(s)}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-sans text-charcoal/50 px-4 py-3 border border-cream-dark bg-white">
                  No slots available for today — please choose a future date.
                </p>
              )}
            </div>

            {/* Special instructions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Special Instructions <span className="text-charcoal/30 normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Remove onions, nut allergy, extra sauce on the side…"
                rows={3}
                maxLength={400}
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors resize-none leading-relaxed"
              />
              <p className="text-[11px] font-sans text-charcoal/35 text-right">
                {specialInstructions.length}/400
              </p>
            </div>

            {/* ── Payment method ── */}
            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Payment Method <span className="text-burgundy">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* Cash at Pickup */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center gap-1.5 px-4 py-4 border text-left transition-colors ${
                    paymentMethod === "cash"
                      ? "border-burgundy bg-burgundy/5"
                      : "border-cream-dark bg-white hover:border-charcoal/30"
                  }`}
                >
                  <span className="text-xl">💵</span>
                  <span className="text-xs tracking-wide font-sans font-medium text-charcoal">Cash at Pickup</span>
                  <span className="text-[10px] font-sans text-charcoal/40 text-center leading-tight">Pay when you collect</span>
                </button>

                {/* Online Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`flex flex-col items-center gap-1.5 px-4 py-4 border text-left transition-colors ${
                    paymentMethod === "online"
                      ? "border-burgundy bg-burgundy/5"
                      : "border-cream-dark bg-white hover:border-charcoal/30"
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span className="text-xs tracking-wide font-sans font-medium text-charcoal">Online Payment</span>
                  <span className="text-[10px] font-sans text-charcoal/40 text-center leading-tight">UPI, cards & wallets</span>
                </button>
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                  consentGiven ? "bg-burgundy border-burgundy" : "bg-white border-cream-dark group-hover:border-charcoal/40"
                }`}>
                  {consentGiven && (
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-sans text-charcoal/50 leading-relaxed">
                I agree to my name, email address and phone number being used to process my order and send me pickup updates via SMS and email.
              </span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 border border-red-200">
                {error}
              </p>
            )}

            {/* ── Submit button ── */}
            {paymentMethod === "cash" ? (
              <button
                onClick={handleCashOrder}
                disabled={!formComplete || loading}
                className="mt-2 py-4 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? "Placing order…" : `Confirm Order · ₹${orderTotal}`}
              </button>
            ) : razorpayReady ? (
              <button
                onClick={handlePayment}
                disabled={!formComplete || loading}
                className="mt-2 py-4 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? "Processing…" : `Pay ₹${orderTotal}`}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-xs font-sans text-amber-700 leading-relaxed">
                    <strong>Razorpay not configured yet.</strong> Use the test button below to place a real order and test the full flow.
                  </p>
                </div>
                <button
                  onClick={handleTestOrder}
                  disabled={!formComplete || loading}
                  className="py-4 bg-charcoal text-cream text-sm tracking-widest uppercase font-sans hover:bg-charcoal/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Placing order…" : `Place Test Order · ₹${orderTotal}`}
                </button>
              </div>
            )}

            <p className="text-xs text-charcoal/40 font-sans text-center leading-relaxed">
              {paymentMethod === "cash"
                ? "Your order will be confirmed immediately. Please bring exact change."
                : razorpayReady
                  ? "Payments powered by Razorpay. UPI, cards, net banking & wallets accepted."
                  : "Test mode — no payment taken. Order will appear in /admin."}
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
