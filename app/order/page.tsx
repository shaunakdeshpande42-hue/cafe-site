"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import FadeIn from "@/components/FadeIn";

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Next N days starting from today (midnight local) */
function getAvailableDates(daysAhead = 14) {
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function formatDateLabel(date: Date, index: number) {
  if (index === 0) return `Today · ${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
  if (index === 1) return `Tomorrow · ${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

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
    // 30 min from now, rounded up to next 15-min boundary
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
  prefill: { name: string; email: string };
  theme: { color: string };
}
interface RazorpayInstance { open(): void }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Date & time state
  const dates                          = getAvailableDates(14);
  const [selectedDateKey, setDateKey]  = useState(toDateKey(dates[0]));
  const [slots, setSlots]              = useState<string[]>([]);
  const [pickupTime, setPickupTime]    = useState("");

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
  const razorpayReady =
    !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== "rzp_test_REPLACE_ME";

  // ── validation ──────────────────────────────────────────────────────────────
  function validate() {
    if (!name.trim() || !email.trim() || !pickupTime) {
      setError("Please fill in all fields."); return false;
    }
    if (items.length === 0) {
      setError("Your cart is empty."); return false;
    }
    setError(""); return true;
  }

  // ── test order (no payment) ──────────────────────────────────────────────────
  async function handleTestOrder() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name, customerEmail: email,
          pickupTime, items, total: orderTotal,
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
              customerName: name, customerEmail: email,
              pickupTime, items, total: orderTotal,
            }),
          });
          const { orderId: saved, error: ve } = await vr.json();
          if (ve) throw new Error(ve);
          clearCart();
          router.push(`/order/${saved}`);
        },
        prefill: { name, email },
        theme: { color: "#6B1830" },
      }).open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
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
              <p className="text-charcoal/50 font-sans text-sm">Your cart is empty.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-cream-dark">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex justify-between items-start">
                    <div>
                      <p className="font-serif text-base text-charcoal">{item.name}</p>
                      <p className="text-xs text-charcoal/50 font-sans mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-sans text-burgundy">₹{item.price * item.quantity}</span>
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
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Name</label>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>

            {/* Pickup date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Pickup Date
              </label>
              <select
                value={selectedDateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
              >
                {dates.map((d, i) => (
                  <option key={toDateKey(d)} value={toDateKey(d)}>
                    {formatDateLabel(d, i)}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">
                Pickup Time
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

            {/* Error */}
            {error && (
              <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 border border-red-200">
                {error}
              </p>
            )}

            {/* Pay / Test button */}
            {razorpayReady ? (
              <button
                onClick={handlePayment}
                disabled={loading || items.length === 0 || slots.length === 0}
                className="mt-2 py-4 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
                  disabled={loading || items.length === 0 || slots.length === 0}
                  className="py-4 bg-charcoal text-cream text-sm tracking-widest uppercase font-sans hover:bg-charcoal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Placing order…" : `Place Test Order · ₹${orderTotal}`}
                </button>
              </div>
            )}

            <p className="text-xs text-charcoal/40 font-sans text-center leading-relaxed">
              {razorpayReady
                ? "Payments powered by Razorpay. UPI, cards, net banking & wallets accepted."
                : "Test mode — no payment taken. Order will appear in /admin."}
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
