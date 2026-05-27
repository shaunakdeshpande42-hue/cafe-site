"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase, type Order, type OrderStatus } from "@/lib/supabase";

const STATUS_STEPS: { key: OrderStatus; label: string; description: string }[] = [
  { key: "received", label: "Order Received", description: "We've got your order and are getting started." },
  { key: "preparing", label: "Preparing", description: "Our team is crafting your items fresh." },
  { key: "ready", label: "Ready for Pickup", description: "Your order is ready! Please head to the counter." },
  { key: "completed", label: "Completed", description: "Thank you for visiting EM Patisserie." },
];

function statusIndex(status: OrderStatus) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(*), order_items(*)")
      .eq("id", id)
      .single();

    if (error) { setError("Order not found."); setLoading(false); return; }
    setOrder(data as Order);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Stop polling once the order is completed — status won't change again
    if (order?.status === "completed") return;
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder, order?.status]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-cream flex items-center justify-center">
        <p className="font-serif text-charcoal/40 text-xl animate-pulse">Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-20 min-h-screen bg-cream flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-serif text-2xl text-charcoal mb-3">Order not found</p>
          <p className="text-charcoal/50 font-sans text-sm">
            This order may have been archived or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  // Completed screen — no live tracking needed, no further polling
  if (order.status === "completed") {
    return (
      <div className="pt-20 min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-burgundy">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40 mb-2">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <h1 className="font-serif text-3xl text-charcoal mb-3">Thank you!</h1>
            <p className="text-charcoal/50 font-sans text-sm leading-relaxed">
              Your order has been completed. We hope you enjoy it — see you again soon.
            </p>
          </div>
          <a
            href="/"
            className="px-8 py-3 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors"
          >
            Back to EM
          </a>
        </div>
      </div>
    );
  }

  const currentIndex = statusIndex(order.status);
  const currentStep = STATUS_STEPS[currentIndex];

  return (
    <div className="pt-20 bg-cream min-h-screen">
      <div className="bg-burgundy py-16 px-6 text-center">
        <p className="text-xs tracking-widest uppercase text-blush font-sans mb-3">Live Status</p>
        <h1 className="font-serif text-4xl text-cream">Track Your Order</h1>
        <p className="text-cream/60 font-sans text-sm mt-3">Order #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-10">
        {/* Status steps */}
        <div className="flex flex-col gap-0">
          {STATUS_STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                    done ? "bg-burgundy border-burgundy" :
                    active ? "border-burgundy bg-cream" :
                    "border-cream-dark bg-cream"
                  }`}>
                    {done ? (
                      <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : active ? (
                      <div className="w-3 h-3 rounded-full bg-burgundy animate-pulse" />
                    ) : null}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-12 mt-1 transition-all duration-500 ${done ? "bg-burgundy" : "bg-cream-dark"}`} />
                  )}
                </div>
                <div className={`pt-1 pb-10 ${active ? "" : "opacity-40"}`}>
                  <p className={`font-serif text-lg ${active ? "text-charcoal" : "text-charcoal/70"}`}>{step.label}</p>
                  {active && (
                    <p className="text-sm font-sans text-charcoal/60 mt-1 leading-relaxed">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status banner */}
        <div className="bg-blush-light border border-blush px-6 py-5 text-center">
          <p className="font-serif text-xl text-charcoal">{currentStep.label}</p>
          <p className="text-sm font-sans text-charcoal/60 mt-1">{currentStep.description}</p>
          {order.pickup_time && (
            <p className="text-xs font-sans text-charcoal/50 mt-3 tracking-widest uppercase">
              Pickup by {new Date(order.pickup_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
          )}
        </div>

        {/* Order details */}
        <div className="border border-cream-dark bg-white p-6 flex flex-col gap-4">
          <h2 className="font-serif text-xl text-charcoal">Order Details</h2>
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm font-sans">
              <span className="text-charcoal/70">{item.item_name} × {item.quantity}</span>
              <span className="text-burgundy">₹{(item.price * item.quantity) / 100}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t border-cream-dark">
            <span className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Total Paid</span>
            <span className="font-serif text-xl text-charcoal">₹{order.total / 100}</span>
          </div>
        </div>

        <p className="text-xs text-charcoal/30 font-sans text-center">
          Status updates automatically every 10 seconds.
        </p>
      </div>
    </div>
  );
}
