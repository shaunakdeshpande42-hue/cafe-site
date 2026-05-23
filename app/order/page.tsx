"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import FadeIn from "@/components/FadeIn";

function generatePickupSlots() {
  const slots: string[] = [];
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 + 30, 0, 0); // first slot 30min from now

  const end = new Date();
  end.setHours(21, 0, 0, 0); // last slot at 9pm

  const cursor = new Date(now);
  while (cursor <= end) {
    slots.push(cursor.toISOString());
    cursor.setMinutes(cursor.getMinutes() + 15);
  }
  return slots;
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string };
  theme: { color: string };
}
interface RazorpayInstance { open(): void }

export default function OrderPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSlots(generatePickupSlots());
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (slots.length > 0 && !pickupTime) setPickupTime(slots[0]);
  }, [slots, pickupTime]);

  const orderTotal = total();

  async function handlePayment() {
    if (!name.trim() || !email.trim() || !pickupTime) {
      setError("Please fill in all fields.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Create Razorpay order
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderTotal * 100 }), // paise
      });
      const { orderId, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      // Open Razorpay modal
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderTotal * 100,
        currency: "INR",
        name: "EM Patisserie",
        description: "Order from EM Patisserie & Artisanal Chocolates",
        order_id: orderId,
        handler: async (response) => {
          // Verify and save order
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              customerName: name,
              customerEmail: email,
              pickupTime,
              items,
              total: orderTotal,
            }),
          });
          const { orderId: savedOrderId, error: verifyError } = await verifyRes.json();
          if (verifyError) throw new Error(verifyError);

          clearCart();
          router.push(`/order/${savedOrderId}`);
        },
        prefill: { name, email },
        theme: { color: "#6B1830" },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-20 bg-cream min-h-screen">
      <div className="bg-blush-light py-16 px-6 text-center">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">Almost there</p>
          <h1 className="font-serif text-4xl text-charcoal">Checkout</h1>
        </FadeIn>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Order summary */}
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

        {/* Customer details */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-5">
            <h2 className="font-serif text-2xl text-charcoal">Your Details</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
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
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Pickup Time</label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
              >
                {slots.map((slot) => (
                  <option key={slot} value={slot}>{formatSlot(slot)}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 border border-red-200">
                {error}
              </p>
            )}

            <button
              onClick={handlePayment}
              disabled={loading || items.length === 0}
              className="mt-2 py-4 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? "Processing…" : `Pay ₹${orderTotal}`}
            </button>

            <p className="text-xs text-charcoal/40 font-sans text-center leading-relaxed">
              Payments powered by Razorpay. UPI, cards, net banking & wallets accepted.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
