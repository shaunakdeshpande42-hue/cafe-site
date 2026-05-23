"use client";

import { useState, useCallback } from "react";
import { type Order, type OrderStatus } from "@/lib/supabase";

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  received: "bg-blue-50 text-blue-700 border-blue-200",
  preparing: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-charcoal/5 text-charcoal/40 border-charcoal/10",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (pwd: string) => {
    setLoading(true);
    const res = await fetch("/api/orders", { headers: { "x-admin-password": pwd } });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Unauthorized"); setLoading(false); return false; }
    setOrders(data);
    setLoading(false);
    return true;
  }, []);

  async function handleLogin() {
    setError("");
    const ok = await fetchOrders(password);
    if (ok) setAuthed(true);
    else setError("Incorrect password.");
  }

  async function advanceStatus(orderId: string, newStatus: OrderStatus) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  if (!authed) {
    return (
      <div className="pt-20 min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="text-center mb-2">
            <h1 className="font-serif text-3xl text-charcoal">Admin</h1>
            <p className="text-sm font-sans text-charcoal/50 mt-1">EM Patisserie Staff View</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className="border border-cream-dark bg-white px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
          />
          {error && <p className="text-sm font-sans text-red-600">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Loading…" : "Enter"}
          </button>
        </div>
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "completed");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <div className="pt-20 bg-cream min-h-screen">
      <div className="bg-charcoal py-10 px-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-cream">Orders</h1>
          <p className="text-cream/50 font-sans text-sm mt-1">{active.length} active · {completed.length} completed today</p>
        </div>
        <button
          onClick={() => fetchOrders(password)}
          className="text-xs tracking-widest uppercase font-sans text-cream/50 hover:text-cream transition-colors border border-cream/20 px-4 py-2"
        >
          Refresh
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-4">
        {orders.length === 0 && (
          <p className="text-center text-charcoal/40 font-sans py-16">No orders yet today.</p>
        )}

        {orders.map((order) => {
          const nextStatus = STATUS_NEXT[order.status];
          return (
            <div key={order.id} className={`bg-white border p-5 flex flex-col gap-4 ${order.status === "completed" ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-serif text-lg text-charcoal">
                    {order.customers?.name}
                  </p>
                  <p className="text-xs font-sans text-charcoal/50 mt-0.5">
                    #{order.id.slice(0, 8).toUpperCase()} · {order.customers?.email}
                  </p>
                  {order.pickup_time && (
                    <p className="text-xs font-sans text-charcoal/50 mt-0.5">
                      Pickup: {new Date(order.pickup_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs tracking-widest uppercase font-sans border px-3 py-1.5 ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  {nextStatus && (
                    <button
                      onClick={() => advanceStatus(order.id, nextStatus)}
                      className="text-xs tracking-widest uppercase font-sans bg-burgundy text-cream px-4 py-1.5 hover:bg-burgundy-dark transition-colors"
                    >
                      → {STATUS_LABEL[nextStatus]}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-cream-dark pt-3 flex flex-col gap-1">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm font-sans text-charcoal/70">
                    <span>{item.item_name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity) / 100}</span>
                  </div>
                ))}
                <div className="flex justify-between font-serif text-base text-charcoal mt-1 pt-1 border-t border-cream-dark">
                  <span>Total</span>
                  <span>₹{order.total / 100}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
