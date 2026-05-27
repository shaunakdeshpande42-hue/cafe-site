"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { type Order, type OrderStatus } from "@/lib/supabase";
import { categories } from "@/lib/menu-data";

// ── Event types ────────────────────────────────────────────────────────────

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  image_url: string | null;
  capacity: number | null;
  event_signups: { count: number }[];
}

// ── Custom order types ─────────────────────────────────────────────────────

interface CustomOrderRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  occasion_other: string | null;
  pickup_date: string;
  pickup_time_slot: string | null;
  serves: string | null;
  flavors: string | null;
  dietary: string | null;
  message_on_cake: string | null;
  design_description: string | null;
  reference_image_url: string | null;
  budget_range: string | null;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const CUSTOM_ORDER_STATUSES = ["new", "reviewing", "confirmed", "declined"] as const;
type CustomOrderStatus = typeof CUSTOM_ORDER_STATUSES[number];

const CUSTOM_STATUS_CONFIG: Record<CustomOrderStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  new:       { label: "New",       color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    dot: "bg-rose-500"    },
  reviewing: { label: "Reviewing", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500"   },
  confirmed: { label: "Confirmed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  declined:  { label: "Declined",  color: "text-charcoal/40", bg: "bg-charcoal/5", border: "border-charcoal/10", dot: "bg-charcoal/30" },
};

// ── Analytics types ────────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: {
    revenueToday: number;
    ordersToday: number;
    revenueThisWeek: number;
    ordersThisWeek: number;
    revenueThisMonth: number;
    ordersThisMonth: number;
    totalCustomers: number;
    activeOrders: number;
    upcomingEventsCount: number;
  };
  statusBreakdown: Record<string, number>;
  days: { date: string; label: string; orders: number; revenue: number }[];
  topItems: { name: string; qty: number }[];
  upcomingEvents: { id: string; title: string; event_date: string; capacity: number | null; signups: number }[];
  recentSignups: { name: string; email: string; created_at: string; event_title: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_FLOW: OrderStatus[] = ["received", "preparing", "ready", "completed"];

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; action: string; color: string; bg: string; border: string; dot: string; cardBorder: string }
> = {
  received: {
    label: "New",
    action: "Start Preparing",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    cardBorder: "border-l-rose-500",
  },
  preparing: {
    label: "Preparing",
    action: "Mark Ready",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    cardBorder: "border-l-amber-500",
  },
  ready: {
    label: "Ready",
    action: "Complete",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    cardBorder: "border-l-emerald-500",
  },
  completed: {
    label: "Completed",
    action: "",
    color: "text-charcoal/40",
    bg: "bg-charcoal/5",
    border: "border-charcoal/10",
    dot: "bg-charcoal/30",
    cardBorder: "border-l-charcoal/20",
  },
};

const REFRESH_INTERVAL = 30; // seconds

type UnavailableEntry = { item_id: string; note: string | null; marked_at: string };
type UnavailableMap = Record<string, { note: string | null }>;

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatPickup(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function itemSummary(order: Order): string {
  const count = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  return `${count} item${count !== 1 ? "s" : ""}`;
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "inventory" | "menu" | "availability" | "events" | "custom-orders" | "specials">("orders");

  // ── Shared DB menu items (active only) — loaded on login ────────────────
  const [dbMenuItems, setDbMenuItems] = useState<{
    id: string; name: string; description: string; price: number;
    category: string; image_url: string | null; badge: string | null;
    note: string | null; is_active: boolean; sort_order: number;
  }[]>([]);
  useEffect(() => {
    if (authed) {
      fetch("/api/menu").then((r) => r.json()).then((data) => setDbMenuItems(data)).catch(() => {});
    }
  }, [authed]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const passwordRef = useRef("");

  // Events state
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [newCapacity, setNewCapacity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Availability state
  const [unavailable, setUnavailable] = useState<UnavailableMap>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [completedOpen, setCompletedOpen] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Custom orders state
  const [customOrders, setCustomOrders] = useState<CustomOrderRequest[]>([]);
  const [customOrdersLoading, setCustomOrdersLoading] = useState(false);
  const [expandedCustomOrder, setExpandedCustomOrder] = useState<string | null>(null);
  const [customOrderFilter, setCustomOrderFilter] = useState<"all" | CustomOrderStatus>("all");
  const [savingCustomStatus, setSavingCustomStatus] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // ── Inventory state ──────────────────────────────────────────────────────
  type InvDraftEntry = { quantity_set: string; is_unlimited: boolean };
  const [inventoryDraft, setInventoryDraft] = useState<Record<string, InvDraftEntry>>({});
  const [inventorySold, setInventorySold]   = useState<Record<string, number>>({});
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySaving,  setInventorySaving]  = useState(false);
  const [inventorySaved,   setInventorySaved]   = useState(false);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const res  = await fetch("/api/inventory");
      const data = await res.json();
      const soldMap: Record<string, number> = {};
      const draft: Record<string, InvDraftEntry> = {};
      for (const entry of data.items ?? []) {
        soldMap[entry.item_id] = entry.sold ?? 0;
        draft[entry.item_id] = {
          quantity_set: entry.is_unlimited ? "" : String(entry.quantity_set ?? ""),
          is_unlimited: entry.is_unlimited,
        };
      }
      setInventorySold(soldMap);
      setInventoryDraft(draft);
    } catch { /* ignore */ }
    setInventoryLoading(false);
  }, []);

  // Fetch when inventory tab is opened
  useEffect(() => {
    if (authed && activeTab === "inventory") fetchInventory();
  }, [authed, activeTab, fetchInventory]);

  async function saveInventory() {
    setInventorySaving(true);
    setInventorySaved(false);
    const items = dbMenuItems
      .filter((item) => {
        const d = inventoryDraft[item.id];
        return d !== undefined; // only save items that have been touched
      })
      .map((item) => {
        const d = inventoryDraft[item.id] ?? { quantity_set: "", is_unlimited: false };
        return {
          item_id: item.id,
          item_name: item.name,
          quantity_set: d.is_unlimited ? null : (d.quantity_set === "" ? null : Number(d.quantity_set)),
          is_unlimited: d.is_unlimited,
        };
      })
      .filter((item) => item.quantity_set !== null || item.is_unlimited);

    if (items.length === 0) { setInventorySaving(false); return; }

    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
      body: JSON.stringify({ items }),
    });
    setInventorySaving(false);
    setInventorySaved(true);
    setTimeout(() => setInventorySaved(false), 3000);
  }

  async function copyFromYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().slice(0, 10);
    const res  = await fetch(`/api/inventory?date=${yd}`);
    const data = await res.json();
    if (!data.items?.length) return;
    const next: Record<string, InvDraftEntry> = { ...inventoryDraft };
    for (const entry of data.items) {
      next[entry.item_id] = {
        quantity_set: entry.is_unlimited ? "" : String(entry.quantity_set ?? ""),
        is_unlimited: entry.is_unlimited,
      };
    }
    setInventoryDraft(next);
  }

  // ── Menu management state ────────────────────────────────────────────────
  interface DbMenuItem {
    id: string; name: string; description: string; price: number;
    category: string; image_url: string | null; badge: string | null;
    note: string | null; is_active: boolean; sort_order: number;
  }
  type MenuForm = {
    name: string; description: string; price: string; category: string;
    badge: string; note: string; image_url: string;
  };
  const emptyForm: MenuForm = { name: "", description: "", price: "", category: "desserts", badge: "", note: "", image_url: "" };

  const [menuMgmt, setMenuMgmt]           = useState<DbMenuItem[]>([]);
  const [menuMgmtLoading, setMenuMgmtLoading] = useState(false);
  const [menuMgmtCat, setMenuMgmtCat]     = useState("all");
  const [showAddForm, setShowAddForm]     = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [menuForm, setMenuForm]           = useState<MenuForm>(emptyForm);
  const [menuSaving, setMenuSaving]       = useState(false);
  const [menuError, setMenuError]         = useState("");
  const [showArchived, setShowArchived]   = useState(false);

  const fetchMenuMgmt = useCallback(async () => {
    setMenuMgmtLoading(true);
    try {
      // Admin fetches ALL items (including archived) via a special header
      const res = await fetch("/api/menu/all", { headers: { "x-admin-password": passwordRef.current } });
      if (res.ok) setMenuMgmt(await res.json());
      else {
        // Fallback to public endpoint if /all not yet available
        const r2 = await fetch("/api/menu");
        if (r2.ok) setMenuMgmt(await r2.json());
      }
    } catch { /* ignore */ }
    setMenuMgmtLoading(false);
  }, []);

  useEffect(() => {
    if (authed && activeTab === "menu") fetchMenuMgmt();
  }, [authed, activeTab, fetchMenuMgmt]);

  async function saveMenuItem(isEdit: boolean) {
    setMenuError("");
    if (!menuForm.name.trim() || !menuForm.price || !menuForm.category) {
      setMenuError("Name, price, and category are required."); return;
    }
    setMenuSaving(true);
    try {
      const payload = {
        name: menuForm.name.trim(),
        description: menuForm.description.trim(),
        price: Number(menuForm.price),
        category: menuForm.category,
        badge: menuForm.badge.trim() || null,
        note: menuForm.note.trim() || null,
        image_url: menuForm.image_url.trim() || null,
      };
      const res = isEdit
        ? await fetch(`/api/menu/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const err = await res.json();
        setMenuError(err.error ?? "Save failed.");
      } else {
        setMenuForm(emptyForm);
        setShowAddForm(false);
        setEditingId(null);
        fetchMenuMgmt();
      }
    } catch { setMenuError("Network error."); }
    setMenuSaving(false);
  }

  async function archiveMenuItem(id: string, archive: boolean) {
    await fetch(`/api/menu/${id}`, {
      method: archive ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
      body: archive ? undefined : JSON.stringify({ is_active: true }),
    });
    setMenuMgmt((prev) =>
      archive
        ? prev.map((i) => i.id === id ? { ...i, is_active: false } : i)
        : prev.map((i) => i.id === id ? { ...i, is_active: true } : i)
    );
  }

  function startEdit(item: DbMenuItem) {
    setEditingId(item.id);
    setShowAddForm(false);
    setMenuForm({
      name: item.name, description: item.description, price: String(item.price),
      category: item.category, badge: item.badge ?? "", note: item.note ?? "",
      image_url: item.image_url ?? "",
    });
    setMenuError("");
  }

  // ── Specials state ───────────────────────────────────────────────────────
  interface AdminSpecial {
    id: string;
    title: string;
    subtitle: string | null;
    link_text: string;
    link_url: string;
    is_active: boolean;
    ends_at: string | null;
    created_at: string;
  }
  type SpecialForm = { title: string; subtitle: string; link_text: string; link_url: string; ends_at: string };
  const emptySpecialForm: SpecialForm = { title: "", subtitle: "", link_text: "See it on the Menu", link_url: "/menu", ends_at: "" };

  const [specials, setSpecials] = useState<AdminSpecial[]>([]);
  const [specialsLoading, setSpecialsLoading] = useState(false);
  const [showSpecialForm, setShowSpecialForm] = useState(false);
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null);
  const [specialForm, setSpecialForm] = useState<SpecialForm>(emptySpecialForm);
  const [specialSaving, setSpecialSaving] = useState(false);
  const [specialError, setSpecialError] = useState("");
  const [deletingSpecialId, setDeletingSpecialId] = useState<string | null>(null);
  const [confirmDeleteSpecialId, setConfirmDeleteSpecialId] = useState<string | null>(null);

  const fetchSpecials = useCallback(async (pwd: string) => {
    setSpecialsLoading(true);
    try {
      const res = await fetch("/api/specials", { headers: { "x-admin-password": pwd } });
      if (res.ok) setSpecials(await res.json());
    } catch { /* ignore */ }
    setSpecialsLoading(false);
  }, []);

  useEffect(() => {
    if (authed && activeTab === "specials") fetchSpecials(passwordRef.current);
  }, [authed, activeTab, fetchSpecials]);

  async function saveSpecial(isEdit: boolean) {
    setSpecialError("");
    if (!specialForm.title.trim()) { setSpecialError("Title is required."); return; }
    setSpecialSaving(true);
    try {
      const payload = {
        title: specialForm.title.trim(),
        subtitle: specialForm.subtitle.trim() || null,
        link_text: specialForm.link_text.trim() || "See it on the Menu",
        link_url: specialForm.link_url.trim() || "/menu",
        ends_at: specialForm.ends_at || null,
      };
      const res = isEdit
        ? await fetch(`/api/specials/${editingSpecialId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/specials", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const err = await res.json();
        setSpecialError(err.error ?? "Save failed.");
      } else {
        setSpecialForm(emptySpecialForm);
        setShowSpecialForm(false);
        setEditingSpecialId(null);
        fetchSpecials(passwordRef.current);
      }
    } catch { setSpecialError("Network error."); }
    setSpecialSaving(false);
  }

  async function toggleSpecialActive(id: string, currentActive: boolean) {
    await fetch(`/api/specials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    setSpecials((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !currentActive } : s));
  }

  async function deleteSpecial(id: string) {
    setDeletingSpecialId(id);
    await fetch(`/api/specials/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": passwordRef.current },
    });
    setDeletingSpecialId(null);
    setConfirmDeleteSpecialId(null);
    setSpecials((prev) => prev.filter((s) => s.id !== id));
  }

  // Export state
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = (() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10);
  })();
  const [exportFrom, setExportFrom] = useState(defaultFrom);
  const [exportTo, setExportTo] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Keep password ref in sync for auto-refresh
  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  // Seed auth from the session cookie set by /admin/login.
  // Middleware already verified the cookie is valid before this page rendered.
  useEffect(() => {
    if (authed) return;
    const cookie = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("admin_session="));
    const value = cookie ? decodeURIComponent(cookie.slice("admin_session=".length)) : "";
    if (value) {
      setPassword(value);
      passwordRef.current = value;
      setAuthed(true);
    }
  }, [authed]);

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (pwd: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders", { headers: { "x-admin-password": pwd } });
      const data = await res.json();
      if (!res.ok) { setOrdersLoading(false); return false; }
      setOrders(data);
      setExpandedOrders(new Set((data as Order[]).map((o) => o.id)));
    } catch {
      // ignore network errors silently for auto-refresh
    }
    setOrdersLoading(false);
    return true;
  }, []);

  const fetchEvents = useCallback(async (pwd: string) => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/events", { headers: { "x-admin-password": pwd } });
      const data = await res.json();
      if (res.ok) setEvents(data);
    } catch { /* ignore */ }
    setEventsLoading(false);
  }, []);

  const fetchAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const res = await fetch("/api/availability");
      const data = await res.json();
      const map: UnavailableMap = {};
      for (const entry of (data.unavailable ?? []) as UnavailableEntry[]) {
        map[entry.item_id] = { note: entry.note };
      }
      setUnavailable(map);
    } catch {
      // ignore
    }
    setAvailLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async (pwd: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { headers: { "x-admin-password": pwd } });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch { /* ignore */ }
    setAnalyticsLoading(false);
  }, []);

  const fetchCustomOrders = useCallback(async (pwd: string) => {
    setCustomOrdersLoading(true);
    try {
      const res = await fetch("/api/custom-order", { headers: { "x-admin-password": pwd } });
      if (res.ok) setCustomOrders(await res.json());
    } catch { /* ignore */ }
    setCustomOrdersLoading(false);
  }, []);

  // Fetch custom orders when tab is opened
  useEffect(() => {
    if (authed && activeTab === "custom-orders") {
      fetchCustomOrders(passwordRef.current);
    }
  }, [authed, activeTab, fetchCustomOrders]);

  async function updateCustomOrderStatus(id: string, status: string, adminNotes?: string) {
    setSavingCustomStatus(id);
    await fetch(`/api/custom-order/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": passwordRef.current },
      body: JSON.stringify({ status, adminNotes }),
    });
    setCustomOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, status, admin_notes: adminNotes ?? o.admin_notes } : o)
    );
    setSavingCustomStatus(null);
  }

  // ── CSV export ───────────────────────────────────────────────────────────

  async function handleExport() {
    setExportError("");
    setExporting(true);
    try {
      const res = await fetch(
        `/api/admin/export?from=${exportFrom}&to=${exportTo}`,
        { headers: { "x-admin-password": passwordRef.current } }
      );
      if (!res.ok) {
        const err = await res.json();
        setExportError(err.error ?? "Export failed.");
        setExporting(false);
        return;
      }
      const { orders, signups, meta } = await res.json();

      // ── Build CSV rows ────────────────────────────────────────────────
      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const row = (...cells: unknown[]) => cells.map(escape).join(",");

      const lines: string[] = [];

      // === ORDERS SHEET ===
      lines.push(row("=== ORDERS ===", `${meta.orderCount} orders`, exportFrom, "to", exportTo));
      lines.push(row(
        "Order ID", "Date", "Time",
        "Customer Name", "Email", "Phone",
        "Items", "Qty", "Total (INR)", "Status", "Pickup Time"
      ));

      for (const o of orders) {
        const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        const itemsStr = (o.order_items ?? [])
          .map((i: { item_name: string; quantity: number }) => `${i.item_name} ×${i.quantity}`)
          .join("; ");
        const totalQty = (o.order_items ?? [])
          .reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
        const dt = new Date(o.created_at);
        lines.push(row(
          o.id.slice(0, 8).toUpperCase(),
          dt.toLocaleDateString("en-IN"),
          dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          cust?.name ?? "",
          cust?.email ?? "",
          cust?.phone ?? "",
          itemsStr,
          totalQty,
          (o.total / 100).toFixed(2),
          o.status,
          o.pickup_time
            ? new Date(o.pickup_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            : ""
        ));
      }

      // blank separator
      lines.push("");
      lines.push("");

      // === EVENT SIGNUPS SHEET ===
      lines.push(row("=== EVENT SIGNUPS ===", `${meta.signupCount} signups`, exportFrom, "to", exportTo));
      lines.push(row("Name", "Email", "Phone", "Event", "Event Date", "Signup Date"));

      for (const s of signups) {
        const evt = Array.isArray(s.events) ? s.events[0] : s.events;
        lines.push(row(
          s.name,
          s.email,
          s.phone ?? "",
          evt?.title ?? "",
          evt?.event_date
            ? new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "",
          new Date(s.created_at).toLocaleDateString("en-IN")
        ));
      }

      // Download
      const csv = "﻿" + lines.join("\n"); // BOM for Excel UTF-8
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `em-patisserie-export-${exportFrom}-to-${exportTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Unexpected error during export.");
    }
    setExporting(false);
  }

  // Auto-refresh for orders
  useEffect(() => {
    if (!authed || !autoRefresh || activeTab !== "orders") return;
    setCountdown(REFRESH_INTERVAL);
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders(passwordRef.current);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [authed, autoRefresh, activeTab, fetchOrders]);

  useEffect(() => {
    if (authed) {
      fetchAvailability();
      fetchEvents(password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, fetchAvailability, fetchEvents]);

  // Fetch analytics when dashboard tab is opened
  useEffect(() => {
    if (authed && activeTab === "dashboard") {
      fetchAnalytics(passwordRef.current);
    }
  }, [authed, activeTab, fetchAnalytics]);

  // ── Login ────────────────────────────────────────────────────────────────

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);
    const ok = await fetchOrders(password);
    setLoginLoading(false);
    if (ok) setAuthed(true);
    else setLoginError("Incorrect password.");
  }

  // ── Order actions ────────────────────────────────────────────────────────

  async function advanceStatus(orderId: string, newStatus: OrderStatus) {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
  }

  function toggleExpanded(orderId: string) {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  // ── Availability actions ─────────────────────────────────────────────────

  async function toggleAvailability(itemId: string, markUnavailable: boolean) {
    setSaving((prev) => ({ ...prev, [itemId]: true }));
    const note = pendingNotes[itemId] ?? null;
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ item_id: itemId, available: !markUnavailable, note: markUnavailable ? note : null }),
    });
    setSaving((prev) => ({ ...prev, [itemId]: false }));
    if (markUnavailable) {
      setUnavailable((prev) => ({ ...prev, [itemId]: { note } }));
    } else {
      setUnavailable((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setPendingNotes((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }

  // ── Event actions ────────────────────────────────────────────────────────

  async function handleCreateEvent() {
    setCreateError("");
    if (!newTitle.trim() || !newDate) {
      setCreateError("Title and date are required.");
      return;
    }
    setCreating(true);
    const event_date = new Date(`${newDate}T${newTime}:00`).toISOString();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription || null,
        event_date,
        image_url: newImageUrl || null,
        capacity: newCapacity ? Number(newCapacity) : null,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error || "Failed to create event."); return; }
    // Reset form and refresh list
    setNewTitle(""); setNewDescription(""); setNewDate("");
    setNewTime("10:00"); setNewCapacity(""); setNewImageUrl("");
    fetchEvents(password);
  }

  async function handleDeleteEvent(id: string) {
    setDeletingId(id);
    await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    setConfirmDeleteId(null);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Login screen ─────────────────────────────────────────────────────────

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
          {loginError && <p className="text-sm font-sans text-red-600">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50"
          >
            {loginLoading ? "Loading…" : "Enter"}
          </button>
        </div>
      </div>
    );
  }

  // ── Compute order groups ─────────────────────────────────────────────────

  const ordersByStatus: Record<OrderStatus, Order[]> = {
    received: [],
    preparing: [],
    ready: [],
    completed: [],
  };
  for (const o of orders) {
    ordersByStatus[o.status]?.push(o);
  }

  const activeCount = orders.filter((o) => o.status !== "completed").length;
  const unavailableCount = Object.keys(unavailable).length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="pt-20 bg-cream min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-charcoal py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-cream">EM Patisserie</h1>
              <p className="text-cream/40 font-sans text-xs tracking-wider mt-1">Staff Dashboard</p>
            </div>
            <div className="flex gap-0 border border-cream/20 overflow-x-auto">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors whitespace-nowrap ${
                  activeTab === "dashboard" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "orders" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Orders
                {activeCount > 0 && (
                  <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                    {activeCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "inventory" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "menu" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab("availability")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "availability" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Availability
                {unavailableCount > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                    {unavailableCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "events" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Events
                {events.filter((e) => new Date(e.event_date) >= new Date()).length > 0 && (
                  <span className="ml-2 bg-cream/20 text-cream text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                    {events.filter((e) => new Date(e.event_date) >= new Date()).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("custom-orders")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "custom-orders" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Custom Cakes
                {customOrders.filter((o) => o.status === "new").length > 0 && (
                  <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                    {customOrders.filter((o) => o.status === "new").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("specials")}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-colors border-l border-cream/20 whitespace-nowrap ${
                  activeTab === "specials" ? "bg-cream text-charcoal" : "text-cream/60 hover:text-cream"
                }`}
              >
                Specials
                {specials.filter((s) => s.is_active).length > 0 && (
                  <span className="ml-2 bg-gold/80 text-charcoal text-[10px] px-1.5 py-0.5 rounded-full font-sans">
                    {specials.filter((s) => s.is_active).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Summary stat cards (orders tab only) ──────────────────── */}
          {activeTab === "orders" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATUS_FLOW.map((status) => {
                const cfg = STATUS_CONFIG[status];
                const count = ordersByStatus[status].length;
                return (
                  <div
                    key={status}
                    className={`${cfg.bg} ${cfg.border} border px-4 py-3 flex items-center gap-3`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${status === "received" && count > 0 ? "animate-pulse" : ""}`} />
                    <div>
                      <p className={`text-2xl font-serif ${cfg.color}`}>{count}</p>
                      <p className={`text-[10px] tracking-widest uppercase font-sans ${cfg.color} opacity-70`}>
                        {cfg.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           DASHBOARD TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header + refresh */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">Overview</h2>
              <p className="text-sm font-sans text-charcoal/40 mt-0.5">Live snapshot of your café</p>
            </div>
            <button
              onClick={() => fetchAnalytics(passwordRef.current)}
              className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
            >
              {analyticsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {analyticsLoading && !analytics && (
            <div className="text-center py-24">
              <p className="font-sans text-charcoal/30 text-sm">Loading analytics…</p>
            </div>
          )}

          {analytics && (
            <div className="flex flex-col gap-6">

              {/* ── KPI cards ─────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-cream-dark p-5">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-3">Today</p>
                  <p className="font-serif text-2xl text-charcoal leading-none">
                    ₹{analytics.kpis.revenueToday.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-sans text-charcoal/45 mt-1.5">
                    {analytics.kpis.ordersToday} order{analytics.kpis.ordersToday !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="bg-white border border-cream-dark p-5">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-3">This Week</p>
                  <p className="font-serif text-2xl text-charcoal leading-none">
                    ₹{analytics.kpis.revenueThisWeek.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-sans text-charcoal/45 mt-1.5">
                    {analytics.kpis.ordersThisWeek} order{analytics.kpis.ordersThisWeek !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="bg-white border border-cream-dark p-5">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-3">This Month</p>
                  <p className="font-serif text-2xl text-charcoal leading-none">
                    ₹{analytics.kpis.revenueThisMonth.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-sans text-charcoal/45 mt-1.5">
                    {analytics.kpis.ordersThisMonth} order{analytics.kpis.ordersThisMonth !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="bg-white border border-cream-dark p-5">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-3">Customers</p>
                  <p className="font-serif text-2xl text-charcoal leading-none">
                    {analytics.kpis.totalCustomers.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-sans text-charcoal/45 mt-1.5">
                    {analytics.kpis.activeOrders} active · {analytics.kpis.upcomingEventsCount} event{analytics.kpis.upcomingEventsCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* ── 7-day chart + status breakdown ────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* 7-day revenue bar chart */}
                <div className="sm:col-span-2 bg-white border border-cream-dark p-6">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-6">
                    Revenue — Last 7 Days
                  </p>
                  <div className="flex items-end gap-1.5" style={{ height: "8rem" }}>
                    {(() => {
                      const maxRev = Math.max(...analytics.days.map((d) => d.revenue), 1);
                      return analytics.days.map((day, i) => {
                        const heightPct = (day.revenue / maxRev) * 100;
                        const isToday = i === analytics.days.length - 1;
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                            <div className="w-full flex flex-col justify-end flex-1">
                              <div
                                className={`w-full transition-all duration-700 rounded-sm ${
                                  isToday ? "bg-burgundy" : "bg-burgundy/20 hover:bg-burgundy/35"
                                }`}
                                style={{ height: `${Math.max(heightPct, 3)}%` }}
                                title={`₹${day.revenue.toLocaleString("en-IN")} · ${day.orders} orders`}
                              />
                            </div>
                            <span className="text-[9px] font-sans text-charcoal/35 text-center leading-tight w-full truncate">
                              {day.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-cream-dark">
                    <span className="text-[10px] font-sans text-charcoal/30">
                      ₹0
                    </span>
                    <span className="text-[10px] font-sans text-charcoal/30">
                      max ₹{Math.max(...analytics.days.map((d) => d.revenue), 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Order status breakdown */}
                <div className="bg-white border border-cream-dark p-6">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-5">
                    Status Breakdown (Week)
                  </p>
                  <div className="flex flex-col gap-4">
                    {(["received", "preparing", "ready", "completed"] as const).map((status) => {
                      const cfg = STATUS_CONFIG[status];
                      const count = analytics.statusBreakdown[status] ?? 0;
                      const total = Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={status}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[10px] tracking-widest uppercase font-sans ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs font-sans text-charcoal/40 font-medium">{count}</span>
                          </div>
                          <div className="h-1.5 bg-charcoal/6 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${cfg.dot} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0) === 0 && (
                      <p className="text-sm font-sans text-charcoal/30 text-center py-2">No orders this week</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Top items + Upcoming events ───────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Top items */}
                <div className="bg-white border border-cream-dark p-6">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-5">
                    Top Items (All Time)
                  </p>
                  {analytics.topItems.length === 0 ? (
                    <p className="text-sm font-sans text-charcoal/30 text-center py-6">No orders yet</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {analytics.topItems.map((item, i) => {
                        const maxQty = analytics.topItems[0].qty;
                        const pct = Math.round((item.qty / maxQty) * 100);
                        return (
                          <div key={item.name} className="flex items-center gap-3">
                            <span className="text-[10px] font-sans text-charcoal/25 w-4 text-right shrink-0 font-medium">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-sans text-charcoal truncate">{item.name}</span>
                                <span className="text-xs font-sans text-charcoal/40 ml-2 shrink-0">×{item.qty}</span>
                              </div>
                              <div className="h-1 bg-charcoal/6 rounded-full">
                                <div
                                  className="h-full bg-burgundy/35 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upcoming events with signup fill */}
                <div className="bg-white border border-cream-dark p-6">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-5">
                    Upcoming Events ({analytics.kpis.upcomingEventsCount})
                  </p>
                  {analytics.upcomingEvents.length === 0 ? (
                    <p className="text-sm font-sans text-charcoal/30 text-center py-6">No upcoming events</p>
                  ) : (
                    <div className="flex flex-col gap-0">
                      {analytics.upcomingEvents.map((event) => {
                        const signupPct = event.capacity
                          ? Math.min(Math.round((event.signups / event.capacity) * 100), 100)
                          : null;
                        const almostFull = signupPct !== null && signupPct >= 80;
                        return (
                          <div key={event.id} className="border-b border-cream-dark py-3.5 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-serif text-sm text-charcoal leading-snug truncate">{event.title}</p>
                                <p className="text-[11px] font-sans text-charcoal/40 mt-0.5">
                                  {new Date(event.event_date).toLocaleDateString("en-IN", {
                                    weekday: "short", day: "numeric", month: "short",
                                  })}
                                  {" · "}
                                  {new Date(event.event_date).toLocaleTimeString("en-IN", {
                                    hour: "2-digit", minute: "2-digit", hour12: true,
                                  })}
                                </p>
                              </div>
                              <span className={`text-[10px] font-sans shrink-0 ${almostFull ? "text-rose-600" : "text-charcoal/40"}`}>
                                {event.signups}{event.capacity ? `/${event.capacity}` : " signups"}
                              </span>
                            </div>
                            {signupPct !== null && (
                              <div className="mt-2 h-1 bg-charcoal/6 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${almostFull ? "bg-rose-400" : "bg-emerald-400"}`}
                                  style={{ width: `${signupPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Recent event signups ──────────────────────────────── */}
              {analytics.recentSignups.length > 0 && (
                <div className="bg-white border border-cream-dark p-6">
                  <p className="text-[9px] tracking-widest uppercase font-sans text-charcoal/35 mb-4">
                    Recent Event Signups
                  </p>
                  <div>
                    {analytics.recentSignups.map((signup, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 border-b border-cream-dark last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-sans text-charcoal">{signup.name}</p>
                          <p className="text-[11px] font-sans text-charcoal/40 mt-0.5 truncate">
                            {signup.email}
                            <span className="text-charcoal/25 mx-1.5">·</span>
                            {signup.event_title}
                          </p>
                        </div>
                        <p className="text-[11px] font-sans text-charcoal/30 ml-4 shrink-0">
                          {timeAgo(signup.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Web Analytics card ────────────────────────────────────── */}
          <div className="mt-6 bg-charcoal/5 border border-charcoal/10 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 bg-charcoal flex items-center justify-center mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-cream">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l4.5-4.5 3 3 4.5-4.5 3 3" />
                  <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth={1.5} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base text-charcoal">Web Analytics</p>
                <p className="text-sm font-sans text-charcoal/50 mt-1 leading-relaxed">
                  Website visits, sessions, page views, and traffic sources are tracked by{" "}
                  <span className="text-charcoal font-medium">Vercel Analytics</span> — now active on your site.
                  Data is visible in the Vercel dashboard and builds up from today onwards.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <a
                    href="https://vercel.com/shaunak1/cafe-site/analytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-charcoal text-cream text-xs tracking-widest uppercase font-sans px-4 py-2.5 hover:bg-burgundy transition-colors"
                  >
                    Open Vercel Analytics
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13L13 3M13 3H7M13 3v6" />
                    </svg>
                  </a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {[
                    { label: "Page Views", note: "Total visits per page" },
                    { label: "Unique Visitors", note: "Distinct browsers/devices" },
                    { label: "Traffic Sources", note: "Direct, search, referral" },
                    { label: "Top Pages", note: "Most visited routes" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white border border-charcoal/10 px-3 py-2.5">
                      <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">{item.label}</p>
                      <p className="text-[11px] font-sans text-charcoal/30 mt-0.5">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Export ───────────────────────────────────────────────────── */}
          <div className="mt-4 bg-white border border-cream-dark p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-5 bg-burgundy" />
              <p className="font-serif text-lg text-charcoal">Export Data</p>
            </div>
            <p className="text-sm font-sans text-charcoal/50 mb-5">
              Download orders and event signups for a date range as a CSV file — opens directly in Excel.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40">From</label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  max={exportTo}
                  className="border border-cream-dark bg-cream px-4 py-2.5 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40">To</label>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  min={exportFrom}
                  max={today}
                  className="border border-cream-dark bg-cream px-4 py-2.5 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40 invisible">Action</label>
                <button
                  onClick={handleExport}
                  disabled={exporting || !exportFrom || !exportTo}
                  className="flex items-center gap-2 px-6 py-2.5 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-40"
                >
                  {exporting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Exporting…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" />
                      </svg>
                      Export CSV
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex gap-2">
                  {[
                    { label: "Today", days: 0 },
                    { label: "7 days", days: 6 },
                    { label: "30 days", days: 29 },
                    { label: "90 days", days: 89 },
                  ].map(({ label, days }) => (
                    <button
                      key={label}
                      onClick={() => {
                        const t = new Date().toISOString().slice(0, 10);
                        const f = new Date();
                        f.setDate(f.getDate() - days);
                        setExportFrom(f.toISOString().slice(0, 10));
                        setExportTo(t);
                      }}
                      className="text-[10px] tracking-widest uppercase font-sans border border-charcoal/15 text-charcoal/40 px-2.5 py-2 hover:border-burgundy hover:text-burgundy transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {exportError && (
              <p className="mt-3 text-sm font-sans text-red-600 bg-red-50 border border-red-200 px-4 py-2">
                {exportError}
              </p>
            )}
            <p className="text-[11px] font-sans text-charcoal/30 mt-4">
              Includes: orders (ID, customer, items, total, status) and event signups for the selected period.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           ORDERS TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Refresh bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-[10px] tracking-widest uppercase font-sans px-3 py-1.5 border transition-colors ${
                  autoRefresh
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-charcoal/20 text-charcoal/40"
                }`}
              >
                {autoRefresh ? `Auto-refresh ${countdown}s` : "Auto-refresh off"}
              </button>
              {ordersLoading && (
                <span className="text-[10px] font-sans text-charcoal/30 tracking-wider">Updating…</span>
              )}
            </div>
            <button
              onClick={() => { fetchOrders(password); setCountdown(REFRESH_INTERVAL); }}
              className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
            >
              Refresh Now
            </button>
          </div>

          {/* Empty state */}
          {orders.length === 0 && !ordersLoading && (
            <div className="text-center py-24">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-charcoal/5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-8 h-8 text-charcoal/20">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-serif text-xl text-charcoal/30">No orders yet</p>
              <p className="text-xs font-sans text-charcoal/25 mt-1">Orders will appear here as they come in</p>
            </div>
          )}

          {/* ── Status-grouped order sections ────────────────────────── */}
          {STATUS_FLOW.map((status) => {
            const sectionOrders = ordersByStatus[status];
            if (sectionOrders.length === 0) return null;

            const cfg = STATUS_CONFIG[status];
            const isCompleted = status === "completed";

            return (
              <div key={status} className="mb-8">
                {/* Section header */}
                <button
                  onClick={() => isCompleted && setCompletedOpen(!completedOpen)}
                  className={`flex items-center gap-3 mb-4 w-full text-left ${isCompleted ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <h2 className={`text-xs tracking-widest uppercase font-sans ${cfg.color} font-medium`}>
                    {cfg.label}
                  </h2>
                  <span className={`text-xs font-sans ${cfg.color} opacity-50`}>
                    ({sectionOrders.length})
                  </span>
                  <div className={`flex-1 h-px ${cfg.border} border-t`} />
                  {isCompleted && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 ${cfg.color} opacity-40 transition-transform duration-200 ${completedOpen ? "rotate-180" : ""}`}
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Cards — completed section is collapsible */}
                {(!isCompleted || completedOpen) && (
                  <div className="flex flex-col gap-3">
                    {sectionOrders.map((order) => {
                      const nextStatus = STATUS_NEXT[order.status];
                      const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;
                      const isExpanded = expandedOrders.has(order.id);
                      const items = order.order_items ?? [];

                      return (
                        <div
                          key={order.id}
                          className={`bg-white border border-cream-dark border-l-4 ${cfg.cardBorder} transition-all duration-200 ${
                            isCompleted ? "opacity-50" : ""
                          }`}
                        >
                          {/* Top row — order ID, time, status */}
                          <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-sm font-semibold text-charcoal tracking-wide">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className={`text-[10px] tracking-widest uppercase font-sans border px-2 py-0.5 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {status === "received" && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                  </span>
                                )}
                              </div>

                              <p className="font-serif text-lg text-charcoal mt-1.5">
                                {order.customers?.name || "Walk-in"}
                              </p>
                              <p className="text-xs font-sans text-charcoal/40 mt-0.5">
                                {order.customers?.email}
                              </p>
                              {order.customers?.phone && (
                                <p className="text-xs font-sans text-charcoal/40 mt-0.5">
                                  {order.customers.phone}
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-sans text-charcoal/40">
                                {timeAgo(order.created_at)}
                              </p>
                              {order.pickup_time && (
                                <div className="mt-1.5 flex items-center gap-1.5 justify-end">
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-charcoal/30">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-sans font-medium text-charcoal/60">
                                    {formatPickup(order.pickup_time)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Summary row — item count + total */}
                          <div className="px-5 pb-3">
                            <button
                              onClick={() => toggleExpanded(order.id)}
                              className="flex items-center gap-2 text-xs font-sans text-charcoal/50 hover:text-charcoal transition-colors group"
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>{itemSummary(order)}</span>
                              <span className="text-charcoal/30">&middot;</span>
                              <span className="font-medium text-charcoal/70">{"₹"}{order.total / 100}</span>
                            </button>

                            {/* Expanded item list */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-cream-dark flex flex-col gap-1.5">
                                {items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm font-sans">
                                    <span className="text-charcoal/70">
                                      {item.item_name}
                                      <span className="text-charcoal/30 ml-1">{"×"}{item.quantity}</span>
                                    </span>
                                    <span className="text-charcoal/50">{"₹"}{(item.price * item.quantity) / 100}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-serif text-charcoal mt-1 pt-2 border-t border-cream-dark">
                                  <span>Total</span>
                                  <span>{"₹"}{order.total / 100}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Special instructions — always visible if present */}
                          {order.special_instructions && (
                            <div className="mx-5 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 flex gap-2.5 items-start">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="text-[10px] tracking-widest uppercase font-sans text-amber-700 font-semibold mb-0.5">Special Instructions</p>
                                <p className="text-sm font-sans text-amber-900 leading-relaxed whitespace-pre-wrap">{order.special_instructions}</p>
                              </div>
                            </div>
                          )}

                          {/* Action button — full width, prominent */}
                          {nextStatus && nextCfg && (
                            <button
                              onClick={() => advanceStatus(order.id, nextStatus)}
                              className={`w-full py-3.5 text-xs tracking-widest uppercase font-sans font-medium transition-colors duration-200 border-t border-cream-dark ${
                                status === "received"
                                  ? "bg-burgundy text-cream hover:bg-burgundy-dark"
                                  : status === "preparing"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-charcoal text-cream hover:bg-charcoal/80"
                              }`}
                            >
                              {cfg.action} &rarr;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           AVAILABILITY TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "availability" && (
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-sans text-sm text-charcoal/50">
                Toggle items to hide them from the menu today.
              </p>
              {unavailableCount > 0 && (
                <p className="font-sans text-sm text-amber-700 mt-1">
                  {unavailableCount} item{unavailableCount !== 1 ? "s" : ""} currently unavailable
                </p>
              )}
            </div>
            <button
              onClick={fetchAvailability}
              className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/20 px-4 py-2"
            >
              Refresh
            </button>
          </div>

          {availLoading ? (
            <p className="text-center text-charcoal/40 font-sans py-16">Loading…</p>
          ) : (
            <div className="flex flex-col gap-10">
              {categories.map((cat) => {
                const items = dbMenuItems.filter((item) => item.category === cat.id);
                return (
                  <div key={cat.id}>
                    <h2 className="font-serif text-xl text-charcoal mb-4 pb-2 border-b border-cream-dark">
                      {cat.label}
                    </h2>
                    <div className="flex flex-col gap-3">
                      {items.map((item) => {
                        const isUnavailable = item.id in unavailable;
                        const isSaving = saving[item.id] ?? false;
                        return (
                          <div
                            key={item.id}
                            className={`bg-white border border-cream-dark p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-opacity ${
                              isUnavailable ? "border-amber-200 bg-amber-50/30" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-serif text-base text-charcoal">{item.name}</span>
                                <span className="text-xs font-sans text-burgundy">{"₹"}{item.price}</span>
                                {item.badge && (
                                  <span className="text-[10px] font-sans tracking-widest uppercase bg-burgundy/10 text-burgundy px-2 py-0.5">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <p className="text-[11px] font-sans text-charcoal/40 italic mt-0.5">{item.note}</p>
                              )}
                              {isUnavailable && (
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add a note (e.g. Back tomorrow)"
                                    value={pendingNotes[item.id] ?? unavailable[item.id]?.note ?? ""}
                                    onChange={(e) =>
                                      setPendingNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                                    }
                                    className="text-xs font-sans border border-amber-200 bg-white px-2 py-1.5 text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors flex-1 max-w-xs"
                                  />
                                  <button
                                    onClick={async () => {
                                      setSaving((prev) => ({ ...prev, [item.id]: true }));
                                      await fetch("/api/availability", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "x-admin-password": password },
                                        body: JSON.stringify({
                                          item_id: item.id,
                                          available: false,
                                          note: pendingNotes[item.id] ?? null,
                                        }),
                                      });
                                      setUnavailable((prev) => ({
                                        ...prev,
                                        [item.id]: { note: pendingNotes[item.id] ?? null },
                                      }));
                                      setSaving((prev) => ({ ...prev, [item.id]: false }));
                                    }}
                                    className="text-[10px] tracking-widest uppercase font-sans bg-charcoal text-cream px-3 py-1.5 hover:bg-burgundy transition-colors whitespace-nowrap"
                                  >
                                    Save Note
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isUnavailable && (
                                <span className="text-[10px] font-sans tracking-widest uppercase text-amber-700">
                                  Unavailable
                                </span>
                              )}
                              <button
                                disabled={isSaving}
                                onClick={() => toggleAvailability(item.id, !isUnavailable)}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                  isUnavailable ? "bg-amber-500" : "bg-charcoal/20"
                                } disabled:opacity-50`}
                                aria-label={isUnavailable ? "Mark available" : "Mark unavailable"}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                    isUnavailable ? "translate-x-6" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           CUSTOM ORDERS TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "custom-orders" && (
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-xl text-charcoal">Custom Cake Enquiries</h2>
              <p className="text-sm font-sans text-charcoal/40 mt-0.5">
                {customOrders.filter((o) => o.status === "new").length} new · {customOrders.length} total
              </p>
            </div>
            <button
              onClick={() => fetchCustomOrders(passwordRef.current)}
              className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2"
            >
              {customOrdersLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-0 border border-charcoal/10 mb-6 w-fit">
            {(["all", ...CUSTOM_ORDER_STATUSES] as const).map((s, i) => {
              const count = s === "all" ? customOrders.length : customOrders.filter((o) => o.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setCustomOrderFilter(s)}
                  className={`px-4 py-2 text-[10px] tracking-widest uppercase font-sans transition-colors ${i > 0 ? "border-l border-charcoal/10" : ""} ${
                    customOrderFilter === s ? "bg-charcoal text-cream" : "text-charcoal/40 hover:text-charcoal"
                  }`}
                >
                  {s === "all" ? "All" : CUSTOM_STATUS_CONFIG[s].label}
                  {count > 0 && (
                    <span className="ml-1.5 opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {customOrdersLoading && customOrders.length === 0 ? (
            <p className="text-center text-charcoal/40 font-sans py-16">Loading…</p>
          ) : (() => {
            const filtered = customOrderFilter === "all"
              ? customOrders
              : customOrders.filter((o) => o.status === customOrderFilter);

            if (filtered.length === 0) {
              return (
                <div className="text-center py-16">
                  <p className="font-serif text-xl text-charcoal/30">No enquiries yet</p>
                  <p className="text-xs font-sans text-charcoal/25 mt-1">
                    {customOrderFilter === "all" ? "Custom cake requests will appear here." : `No ${customOrderFilter} enquiries.`}
                  </p>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-3">
                {filtered.map((req) => {
                  const cfg = CUSTOM_STATUS_CONFIG[req.status as CustomOrderStatus] ?? CUSTOM_STATUS_CONFIG.new;
                  const isExpanded = expandedCustomOrder === req.id;
                  const isSaving = savingCustomStatus === req.id;
                  const pickupFormatted = new Date(req.pickup_date).toLocaleDateString("en-IN", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                  });

                  return (
                    <div key={req.id} className={`bg-white border border-cream-dark border-l-4 ${
                      req.status === "new" ? "border-l-rose-500" :
                      req.status === "reviewing" ? "border-l-amber-500" :
                      req.status === "confirmed" ? "border-l-emerald-500" :
                      "border-l-charcoal/20"
                    }`}>
                      {/* Card header — always visible */}
                      <button
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 flex-wrap"
                        onClick={() => setExpandedCustomOrder(isExpanded ? null : req.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="font-mono text-xs font-semibold text-charcoal/40 tracking-wide">
                              #{req.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className={`text-[10px] tracking-widest uppercase font-sans border px-2 py-0.5 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {req.status === "new" && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-lg text-charcoal">{req.name}</p>
                          <p className="text-xs font-sans text-charcoal/40 mt-0.5">
                            {req.occasion}{req.occasion_other ? ` — ${req.occasion_other}` : ""}
                            <span className="mx-2 text-charcoal/20">·</span>
                            Pickup: {pickupFormatted}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <p className="text-xs font-sans text-charcoal/40">{timeAgo(req.created_at)}</p>
                          <svg
                            viewBox="0 0 20 20" fill="currentColor"
                            className={`w-4 h-4 text-charcoal/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-cream-dark px-5 py-5 flex flex-col gap-5">

                          {/* Contact + pickup */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Contact</p>
                              <p className="text-sm font-sans text-charcoal">{req.name}</p>
                              <a href={`mailto:${req.email}`} className="text-sm font-sans text-burgundy hover:underline">{req.email}</a>
                              <p className="text-sm font-sans text-charcoal/60 mt-0.5">{req.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Pickup</p>
                              <p className="text-sm font-sans text-charcoal">{pickupFormatted}</p>
                              {req.pickup_time_slot && <p className="text-sm font-sans text-charcoal/60">{req.pickup_time_slot}</p>}
                            </div>
                          </div>

                          {/* Cake specs */}
                          <div>
                            <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-3">Cake Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                { label: "Serves", val: req.serves },
                                { label: "Flavours", val: req.flavors },
                                { label: "Dietary", val: req.dietary },
                                { label: "Cake Message", val: req.message_on_cake },
                                { label: "Budget", val: req.budget_range },
                              ].filter((r) => r.val).map(({ label, val }) => (
                                <div key={label} className="bg-cream-dark/30 px-3 py-2.5">
                                  <p className="text-[10px] font-sans text-charcoal/40 mb-0.5">{label}</p>
                                  <p className="text-sm font-sans text-charcoal">{val}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Design description */}
                          {req.design_description && (
                            <div>
                              <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Design Description</p>
                              <p className="text-sm font-sans text-charcoal/70 leading-relaxed bg-cream-dark/30 px-4 py-3 border-l-2 border-burgundy/30">
                                {req.design_description}
                              </p>
                            </div>
                          )}

                          {/* Reference image */}
                          {req.reference_image_url && (
                            <div>
                              <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Reference Image</p>
                              <a
                                href={req.reference_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-sans text-burgundy hover:underline break-all"
                              >
                                {req.reference_image_url} ↗
                              </a>
                            </div>
                          )}

                          {/* Additional notes */}
                          {req.additional_notes && (
                            <div>
                              <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Additional Notes</p>
                              <p className="text-sm font-sans text-charcoal/70 leading-relaxed bg-cream-dark/30 px-4 py-3">
                                {req.additional_notes}
                              </p>
                            </div>
                          )}

                          {/* Admin notes */}
                          <div>
                            <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mb-2">Admin Notes (internal)</p>
                            <textarea
                              rows={2}
                              value={editingNotes[req.id] ?? req.admin_notes ?? ""}
                              onChange={(e) => setEditingNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              placeholder="Add internal notes about this request…"
                              className="w-full border border-cream-dark bg-cream px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors resize-none"
                            />
                          </div>

                          {/* Status actions */}
                          <div className="flex items-center gap-3 flex-wrap pt-1">
                            <p className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 mr-1">Set Status:</p>
                            {CUSTOM_ORDER_STATUSES.filter((s) => s !== req.status).map((s) => {
                              const scfg = CUSTOM_STATUS_CONFIG[s];
                              return (
                                <button
                                  key={s}
                                  disabled={isSaving}
                                  onClick={() => updateCustomOrderStatus(req.id, s, editingNotes[req.id] ?? req.admin_notes ?? undefined)}
                                  className={`text-xs tracking-widest uppercase font-sans px-4 py-2 border transition-colors disabled:opacity-40 ${scfg.bg} ${scfg.border} ${scfg.color} hover:opacity-80`}
                                >
                                  {isSaving ? "Saving…" : `→ ${scfg.label}`}
                                </button>
                              );
                            })}
                            {editingNotes[req.id] !== undefined && editingNotes[req.id] !== (req.admin_notes ?? "") && (
                              <button
                                disabled={isSaving}
                                onClick={() => updateCustomOrderStatus(req.id, req.status, editingNotes[req.id])}
                                className="text-xs tracking-widest uppercase font-sans px-4 py-2 bg-charcoal text-cream hover:bg-burgundy transition-colors disabled:opacity-40"
                              >
                                Save Notes
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           EVENTS TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "events" && (
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* ── Create form ─────────────────────────────────────────────── */}
          <div className="bg-white border border-cream-dark p-6 mb-10">
            <h2 className="font-serif text-xl text-charcoal mb-6">Create New Event</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Title */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chocolate Tasting Workshop"
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Date *</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>

              {/* Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Time *</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>

              {/* Capacity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Capacity <span className="normal-case tracking-normal text-charcoal/30">(optional)</span></label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="e.g. 20"
                  min={1}
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>

              {/* Image URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Image URL <span className="normal-case tracking-normal text-charcoal/30">(optional)</span></label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase font-sans text-charcoal/50">Description <span className="normal-case tracking-normal text-charcoal/30">(optional)</span></label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tell guests what to expect..."
                  rows={3}
                  className="border border-cream-dark bg-cream px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors resize-none"
                />
              </div>
            </div>

            {createError && (
              <p className="text-sm font-sans text-red-600 bg-red-50 border border-red-200 px-4 py-2 mb-4">
                {createError}
              </p>
            )}

            <button
              onClick={handleCreateEvent}
              disabled={creating}
              className="px-8 py-3 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Event"}
            </button>
          </div>

          {/* ── Events list ─────────────────────────────────────────────── */}
          {eventsLoading ? (
            <p className="text-center text-charcoal/40 font-sans py-16">Loading…</p>
          ) : (() => {
            const now = new Date();
            const upcoming = events.filter((e) => new Date(e.event_date) >= now);
            const past = events.filter((e) => new Date(e.event_date) < now);

            function EventCard({ event }: { event: AdminEvent }) {
              const signupCount = event.event_signups?.[0]?.count ?? 0;
              const isPast = new Date(event.event_date) < now;
              const isConfirming = confirmDeleteId === event.id;
              const isDeleting = deletingId === event.id;

              const dateStr = new Date(event.event_date).toLocaleDateString("en-IN", {
                weekday: "short", day: "numeric", month: "short", year: "numeric",
              });
              const timeStr = new Date(event.event_date).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit", hour12: true,
              });

              return (
                <div className={`bg-white border border-cream-dark p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${isPast ? "opacity-60" : ""}`}>
                  {/* Date block */}
                  <div className="shrink-0 w-14 h-14 bg-burgundy/10 flex flex-col items-center justify-center">
                    <span className="font-serif text-xl text-burgundy leading-none">
                      {new Date(event.event_date).getDate()}
                    </span>
                    <span className="text-[10px] font-sans text-burgundy/70 tracking-wider uppercase">
                      {new Date(event.event_date).toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-charcoal leading-snug">{event.title}</p>
                    <p className="text-xs font-sans text-charcoal/50 mt-0.5">
                      {dateStr} · {timeStr}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-sans text-charcoal/40">
                        {signupCount} signup{signupCount !== 1 ? "s" : ""}
                        {event.capacity ? ` / ${event.capacity}` : ""}
                      </span>
                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="text-xs font-sans text-burgundy hover:underline underline-offset-2"
                      >
                        View public page ↗
                      </Link>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isConfirming ? (
                      <>
                        <span className="text-xs font-sans text-charcoal/60">Delete?</span>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={isDeleting}
                          className="text-xs tracking-widest uppercase font-sans bg-red-600 text-white px-3 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs tracking-widest uppercase font-sans border border-charcoal/20 text-charcoal/60 px-3 py-1.5 hover:text-charcoal transition-colors"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="text-xs tracking-widest uppercase font-sans border border-charcoal/15 text-charcoal/40 px-3 py-1.5 hover:border-red-300 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-10">
                {/* Upcoming */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h2 className="text-xs tracking-widest uppercase font-sans text-emerald-700 font-medium">
                      Upcoming
                    </h2>
                    <span className="text-xs font-sans text-charcoal/30">({upcoming.length})</span>
                    <div className="flex-1 h-px border-t border-emerald-100" />
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-sm font-sans text-charcoal/40 py-6 text-center">
                      No upcoming events — create one above.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
                    </div>
                  )}
                </div>

                {/* Past — collapsible */}
                {past.length > 0 && (
                  <div>
                    <button
                      onClick={() => setPastOpen(!pastOpen)}
                      className="flex items-center gap-3 mb-4 w-full text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-charcoal/30" />
                      <h2 className="text-xs tracking-widest uppercase font-sans text-charcoal/40 font-medium">
                        Past
                      </h2>
                      <span className="text-xs font-sans text-charcoal/25">({past.length})</span>
                      <div className="flex-1 h-px border-t border-charcoal/10" />
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-4 h-4 text-charcoal/30 transition-transform duration-200 ${pastOpen ? "rotate-180" : ""}`}
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {pastOpen && (
                      <div className="flex flex-col gap-3">
                        {past.map((event) => <EventCard key={event.id} event={event} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════════
           MENU MANAGEMENT TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "menu" && (() => {
        const visibleItems = menuMgmt.filter((item) => {
          const catMatch = menuMgmtCat === "all" || item.category === menuMgmtCat;
          const activeMatch = showArchived ? !item.is_active : item.is_active;
          return catMatch && activeMatch;
        });

        const inputCls = "w-full border border-cream-dark bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors";
        const FormPanel = ({ isEdit }: { isEdit: boolean }) => (
          <div className="bg-white border border-burgundy/30 p-6 mb-6">
            <h3 className="font-serif text-lg text-charcoal mb-5">
              {isEdit ? "Edit Item" : "Add New Item"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Name *</label>
                <input className={inputCls} value={menuForm.name} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mango Tart" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Price (₹) *</label>
                <input className={inputCls} type="number" min={0} value={menuForm.price} onChange={(e) => setMenuForm((p) => ({ ...p, price: e.target.value }))} placeholder="e.g. 280" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Category *</label>
                <select className={inputCls} value={menuForm.category} onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value }))}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Badge <span className="text-charcoal/30 normal-case">(optional)</span></label>
                <input className={inputCls} value={menuForm.badge} onChange={(e) => setMenuForm((p) => ({ ...p, badge: e.target.value }))} placeholder="e.g. Bestseller, Signature, New" />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Description</label>
                <textarea rows={2} className={`${inputCls} resize-none`} value={menuForm.description} onChange={(e) => setMenuForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description shown on the menu card…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Note <span className="text-charcoal/30 normal-case">(e.g. Pack of 6, 500g)</span></label>
                <input className={inputCls} value={menuForm.note} onChange={(e) => setMenuForm((p) => ({ ...p, note: e.target.value }))} placeholder="e.g. Serves 2 · Pack of 6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">Image URL <span className="text-charcoal/30 normal-case">(optional)</span></label>
                <input className={inputCls} value={menuForm.image_url} onChange={(e) => setMenuForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
            {menuError && <p className="text-sm font-sans text-red-600 mt-3">{menuError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => saveMenuItem(isEdit)}
                disabled={menuSaving}
                className="px-6 py-2.5 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50"
              >
                {menuSaving ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setEditingId(null); setMenuForm(emptyForm); setMenuError(""); }}
                className="px-6 py-2.5 border border-charcoal/20 text-charcoal/60 text-xs tracking-widest uppercase font-sans hover:border-charcoal/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

        return (
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl text-charcoal">Menu Management</h2>
                <p className="text-sm font-sans text-charcoal/40 mt-0.5">
                  {menuMgmt.filter((i) => i.is_active).length} active · {menuMgmt.filter((i) => !i.is_active).length} archived
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`text-xs tracking-widest uppercase font-sans px-4 py-2 border transition-colors ${showArchived ? "border-charcoal/40 text-charcoal bg-charcoal/5" : "border-charcoal/15 text-charcoal/40 hover:border-charcoal/30 hover:text-charcoal"}`}
                >
                  {showArchived ? "Showing Archived" : "Show Archived"}
                </button>
                <button
                  onClick={() => fetchMenuMgmt()}
                  className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
                >
                  {menuMgmtLoading ? "Loading…" : "Refresh"}
                </button>
                {!showAddForm && !editingId && (
                  <button
                    onClick={() => { setShowAddForm(true); setEditingId(null); setMenuForm(emptyForm); setMenuError(""); }}
                    className="text-xs tracking-widest uppercase font-sans px-6 py-2 bg-burgundy text-cream hover:bg-burgundy-dark transition-colors"
                  >
                    + Add Item
                  </button>
                )}
              </div>
            </div>

            {/* Add form */}
            {showAddForm && !editingId && <FormPanel isEdit={false} />}

            {/* Category filter */}
            <div className="flex gap-0 border-b border-cream-dark mb-6 overflow-x-auto">
              {[{ id: "all", label: "All" }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMenuMgmtCat(cat.id)}
                  className={`px-5 py-3 text-xs tracking-widest uppercase font-sans border-b-2 whitespace-nowrap transition-colors ${
                    menuMgmtCat === cat.id ? "border-burgundy text-burgundy" : "border-transparent text-charcoal/40 hover:text-charcoal"
                  }`}
                >
                  {cat.label}
                  <span className="ml-1.5 text-charcoal/30">
                    ({menuMgmt.filter((i) => (cat.id === "all" || i.category === cat.id) && (showArchived ? !i.is_active : i.is_active)).length})
                  </span>
                </button>
              ))}
            </div>

            {menuMgmtLoading ? (
              <div className="text-center py-20"><p className="text-sm font-sans text-charcoal/30">Loading menu…</p></div>
            ) : visibleItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm font-sans text-charcoal/40">
                  {showArchived ? "No archived items in this category." : "No items here yet — add one above."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleItems.map((item) => (
                  <div key={item.id}>
                    {editingId === item.id && <FormPanel isEdit={true} />}
                    {editingId !== item.id && (
                      <div className={`bg-white border border-cream-dark px-5 py-4 flex items-start gap-4 ${!item.is_active ? "opacity-50" : ""}`}>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif text-base text-charcoal">{item.name}</span>
                            {item.badge && (
                              <span className="text-[10px] font-sans tracking-wider uppercase bg-burgundy/10 text-burgundy px-2 py-0.5">{item.badge}</span>
                            )}
                            {!item.is_active && (
                              <span className="text-[10px] font-sans tracking-wider uppercase bg-charcoal/10 text-charcoal/40 px-2 py-0.5">Archived</span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-charcoal/45 mt-0.5 line-clamp-1">{item.description}</p>
                          <div className="flex gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs font-sans font-medium text-burgundy">₹{item.price}</span>
                            <span className="text-xs font-sans text-charcoal/35 capitalize">{item.category}</span>
                            {item.note && <span className="text-xs font-sans text-charcoal/35 italic">{item.note}</span>}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {item.is_active ? (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="text-[11px] tracking-widest uppercase font-sans px-3 py-1.5 border border-charcoal/15 text-charcoal/50 hover:border-charcoal/30 hover:text-charcoal transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => archiveMenuItem(item.id, true)}
                                className="text-[11px] tracking-widest uppercase font-sans px-3 py-1.5 border border-charcoal/15 text-charcoal/40 hover:border-rose-300 hover:text-rose-600 transition-colors"
                                title="Remove from menu (can be restored)"
                              >
                                Archive
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => archiveMenuItem(item.id, false)}
                              className="text-[11px] tracking-widest uppercase font-sans px-3 py-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════
           SPECIALS TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "specials" && (
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">Specials &amp; Announcements</h2>
              <p className="text-sm font-sans text-charcoal/40 mt-0.5">
                Announce new products, promotions, or seasonal highlights — shown as a banner on the homepage.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchSpecials(passwordRef.current)}
                className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
              >
                {specialsLoading ? "Loading…" : "Refresh"}
              </button>
              {!showSpecialForm && !editingSpecialId && (
                <button
                  onClick={() => { setShowSpecialForm(true); setEditingSpecialId(null); setSpecialForm(emptySpecialForm); setSpecialError(""); }}
                  className="text-xs tracking-widest uppercase font-sans px-6 py-2 bg-burgundy text-cream hover:bg-burgundy-dark transition-colors"
                >
                  + New Special
                </button>
              )}
            </div>
          </div>

          {/* How it looks */}
          <div className="mb-8 mt-6 bg-charcoal/80 rounded-sm px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-gold shrink-0 text-sm">✦</span>
              <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                <span className="font-serif text-cream text-sm leading-snug">New: Mango Mille-Feuille</span>
                <span className="text-cream/30 hidden sm:inline">·</span>
                <span className="text-cream/60 font-sans text-xs hidden sm:inline">Summer seasonal — only on weekends</span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[11px] tracking-widest uppercase font-sans text-cream/70 border-b border-cream/30 pb-px whitespace-nowrap">See it on the Menu →</span>
              <span className="text-cream/40 text-xs">✕</span>
            </div>
          </div>
          <p className="text-[11px] font-sans text-charcoal/35 -mt-5 mb-8 pl-1">Preview of how the banner appears on the homepage.</p>

          {/* Add / Edit form */}
          {(showSpecialForm || editingSpecialId) && (() => {
            const inputCls = "w-full border border-cream-dark bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-burgundy transition-colors";
            return (
              <div className="bg-white border border-burgundy/30 p-6 mb-8">
                <h3 className="font-serif text-lg text-charcoal mb-5">
                  {editingSpecialId ? "Edit Special" : "Add New Special"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">
                      Banner Title * <span className="normal-case tracking-normal font-normal text-charcoal/30">– e.g. "New: Mango Mille-Feuille"</span>
                    </label>
                    <input
                      className={inputCls}
                      value={specialForm.title}
                      onChange={(e) => setSpecialForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="New: Mango Mille-Feuille"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">
                      Subtitle <span className="normal-case tracking-normal font-normal text-charcoal/30">(optional, shown smaller beside title)</span>
                    </label>
                    <input
                      className={inputCls}
                      value={specialForm.subtitle}
                      onChange={(e) => setSpecialForm((p) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="Summer seasonal · Only on weekends"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">
                      Button Text
                    </label>
                    <input
                      className={inputCls}
                      value={specialForm.link_text}
                      onChange={(e) => setSpecialForm((p) => ({ ...p, link_text: e.target.value }))}
                      placeholder="See it on the Menu"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">
                      Button Link <span className="normal-case tracking-normal font-normal text-charcoal/30">(URL or /path)</span>
                    </label>
                    <input
                      className={inputCls}
                      value={specialForm.link_url}
                      onChange={(e) => setSpecialForm((p) => ({ ...p, link_url: e.target.value }))}
                      placeholder="/menu"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-widest uppercase font-sans text-charcoal/50">
                      Expires On <span className="normal-case tracking-normal font-normal text-charcoal/30">(leave blank = no expiry)</span>
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={specialForm.ends_at}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setSpecialForm((p) => ({ ...p, ends_at: e.target.value }))}
                    />
                  </div>
                </div>
                {specialError && (
                  <p className="text-sm font-sans text-red-600 bg-red-50 border border-red-200 px-4 py-2 mt-4">
                    {specialError}
                  </p>
                )}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => saveSpecial(!!editingSpecialId)}
                    disabled={specialSaving}
                    className="px-6 py-2.5 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors disabled:opacity-50"
                  >
                    {specialSaving ? "Saving…" : editingSpecialId ? "Save Changes" : "Publish Special"}
                  </button>
                  <button
                    onClick={() => { setShowSpecialForm(false); setEditingSpecialId(null); setSpecialForm(emptySpecialForm); setSpecialError(""); }}
                    className="px-6 py-2.5 border border-charcoal/20 text-charcoal/60 text-xs tracking-widest uppercase font-sans hover:border-charcoal/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Specials list */}
          {specialsLoading && specials.length === 0 ? (
            <p className="text-center text-charcoal/40 font-sans py-16">Loading…</p>
          ) : specials.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-charcoal/15">
              <p className="font-serif text-xl text-charcoal/30">No specials yet</p>
              <p className="text-xs font-sans text-charcoal/25 mt-1">Create one above to show the banner on the homepage.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {specials.map((s) => {
                const isExpired = s.ends_at ? s.ends_at < new Date().toISOString().slice(0, 10) : false;
                const isConfirming = confirmDeleteSpecialId === s.id;
                const isDeleting = deletingSpecialId === s.id;
                const isEditing = editingSpecialId === s.id;

                return (
                  <div
                    key={s.id}
                    className={`bg-white border border-cream-dark border-l-4 ${
                      s.is_active && !isExpired ? "border-l-gold/60" : "border-l-charcoal/15"
                    } ${isEditing ? "opacity-50" : ""}`}
                  >
                    <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {s.is_active && !isExpired ? (
                            <span className="text-[10px] tracking-widest uppercase font-sans bg-gold/15 text-amber-700 border border-gold/30 px-2 py-0.5">
                              Live
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] tracking-widest uppercase font-sans bg-charcoal/5 text-charcoal/40 border border-charcoal/10 px-2 py-0.5">
                              Expired
                            </span>
                          ) : (
                            <span className="text-[10px] tracking-widest uppercase font-sans bg-charcoal/5 text-charcoal/40 border border-charcoal/10 px-2 py-0.5">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-base text-charcoal leading-snug">{s.title}</p>
                        {s.subtitle && (
                          <p className="text-xs font-sans text-charcoal/50 mt-0.5">{s.subtitle}</p>
                        )}
                        <div className="flex gap-3 mt-1.5 flex-wrap">
                          <span className="text-[11px] font-sans text-charcoal/35">
                            → <span className="text-burgundy">{s.link_text}</span>
                            <span className="text-charcoal/25 ml-1">({s.link_url})</span>
                          </span>
                          {s.ends_at && (
                            <span className="text-[11px] font-sans text-charcoal/35">
                              Expires: {new Date(s.ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {/* Active toggle */}
                        {!isExpired && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-sans text-charcoal/40 tracking-wide">
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                            <button
                              onClick={() => toggleSpecialActive(s.id, s.is_active)}
                              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                                s.is_active ? "bg-gold/70" : "bg-charcoal/20"
                              }`}
                              aria-label={s.is_active ? "Deactivate" : "Activate"}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                                  s.is_active ? "left-5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Edit */}
                        {!showSpecialForm && (
                          <button
                            onClick={() => {
                              setEditingSpecialId(s.id);
                              setShowSpecialForm(false);
                              setSpecialForm({
                                title: s.title,
                                subtitle: s.subtitle ?? "",
                                link_text: s.link_text,
                                link_url: s.link_url,
                                ends_at: s.ends_at ?? "",
                              });
                              setSpecialError("");
                            }}
                            className="text-[11px] tracking-widest uppercase font-sans px-3 py-1.5 border border-charcoal/15 text-charcoal/50 hover:border-charcoal/30 hover:text-charcoal transition-colors"
                          >
                            Edit
                          </button>
                        )}

                        {/* Delete */}
                        {isConfirming ? (
                          <>
                            <span className="text-xs font-sans text-charcoal/60">Delete?</span>
                            <button
                              onClick={() => deleteSpecial(s.id)}
                              disabled={isDeleting}
                              className="text-xs tracking-widest uppercase font-sans bg-red-600 text-white px-3 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteSpecialId(null)}
                              className="text-xs tracking-widest uppercase font-sans border border-charcoal/20 text-charcoal/60 px-3 py-1.5 hover:text-charcoal transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteSpecialId(s.id)}
                            className="text-[11px] tracking-widest uppercase font-sans px-3 py-1.5 border border-charcoal/15 text-charcoal/40 hover:border-red-300 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tip */}
          <div className="mt-8 bg-charcoal/5 border border-charcoal/10 px-5 py-4">
            <p className="text-[11px] font-sans text-charcoal/40 leading-relaxed">
              <span className="text-charcoal/60 font-medium">How it works: </span>
              Only one banner is shown at a time — the most recent active one. Set an expiry date for time-limited offers.
              Visitors can dismiss the banner per session; it won&apos;t reappear until their next visit.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           INVENTORY TAB
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "inventory" && (() => {
        const todayLabel = new Date().toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });

        // Summary counts
        const allItems = dbMenuItems;
        const configuredCount = allItems.filter((item) => {
          const d = inventoryDraft[item.id];
          return d && (d.is_unlimited || d.quantity_set !== "");
        }).length;

        const soldOutCount = allItems.filter((item) => {
          const d = inventoryDraft[item.id];
          if (!d || d.is_unlimited || d.quantity_set === "") return false;
          const sold = inventorySold[item.id] ?? 0;
          return Math.max(0, Number(d.quantity_set) - sold) === 0;
        }).length;

        const lowStockCount = allItems.filter((item) => {
          const d = inventoryDraft[item.id];
          if (!d || d.is_unlimited || d.quantity_set === "") return false;
          const sold = inventorySold[item.id] ?? 0;
          const rem  = Math.max(0, Number(d.quantity_set) - sold);
          return rem > 0 && rem <= 5;
        }).length;

        const inputCls = "w-20 border border-cream-dark bg-white px-2 py-1.5 font-sans text-sm text-charcoal text-center focus:outline-none focus:border-burgundy transition-colors disabled:bg-cream disabled:text-charcoal/30";

        return (
          <div className="max-w-5xl mx-auto px-6 py-8">

            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl text-charcoal">Daily Inventory</h2>
                <p className="text-sm font-sans text-charcoal/40 mt-0.5">{todayLabel}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={copyFromYesterday}
                  className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
                >
                  Copy from Yesterday
                </button>
                <button
                  onClick={fetchInventory}
                  className="text-xs tracking-widest uppercase font-sans text-charcoal/40 hover:text-charcoal transition-colors border border-charcoal/15 px-4 py-2 hover:border-charcoal/30"
                >
                  {inventoryLoading ? "Loading…" : "Refresh"}
                </button>
                <button
                  onClick={saveInventory}
                  disabled={inventorySaving}
                  className={`text-xs tracking-widest uppercase font-sans px-6 py-2 transition-colors disabled:opacity-50 ${
                    inventorySaved
                      ? "bg-emerald-600 text-white"
                      : "bg-burgundy text-cream hover:bg-burgundy-dark"
                  }`}
                >
                  {inventorySaving ? "Saving…" : inventorySaved ? "Saved ✓" : "Save All"}
                </button>
              </div>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white border border-cream-dark px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-sans text-charcoal/60 tracking-wide">
                  <span className="text-charcoal font-medium">{configuredCount}</span> / {allItems.length} configured
                </span>
              </div>
              {soldOutCount > 0 && (
                <div className="flex items-center gap-2 bg-white border border-rose-200 px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-sans text-rose-700 tracking-wide">
                    <span className="font-medium">{soldOutCount}</span> sold out
                  </span>
                </div>
              )}
              {lowStockCount > 0 && (
                <div className="flex items-center gap-2 bg-white border border-amber-200 px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-sans text-amber-700 tracking-wide">
                    <span className="font-medium">{lowStockCount}</span> low stock
                  </span>
                </div>
              )}
            </div>

            {inventoryLoading ? (
              <div className="text-center py-20">
                <p className="text-sm font-sans text-charcoal/30">Loading inventory…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {categories.map((cat) => {
                  const catItems = dbMenuItems.filter((item) => item.category === cat.id);
                  return (
                    <div key={cat.id}>
                      {/* Category heading */}
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xs tracking-widest uppercase font-sans text-charcoal/50 font-medium">
                          {cat.label}
                        </h3>
                        <div className="flex-1 h-px bg-cream-dark" />
                      </div>

                      {/* Items table */}
                      <div className="bg-white border border-cream-dark divide-y divide-cream-dark">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-cream/60">
                          <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40">Item</span>
                          <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40 text-center">Qty Today</span>
                          <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40 text-center">Unlimited</span>
                          <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/40 text-center">Status</span>
                        </div>

                        {catItems.map((item) => {
                          const draft   = inventoryDraft[item.id] ?? { quantity_set: "", is_unlimited: false };
                          const sold    = inventorySold[item.id] ?? 0;
                          const qtyNum  = draft.quantity_set === "" ? null : Number(draft.quantity_set);
                          const remaining = draft.is_unlimited || qtyNum === null
                            ? null
                            : Math.max(0, qtyNum - sold);

                          const isConfigured = draft.is_unlimited || draft.quantity_set !== "";
                          const isSoldOut    = !draft.is_unlimited && remaining !== null && remaining === 0;
                          const isLow        = !draft.is_unlimited && remaining !== null && remaining > 0 && remaining <= 5;

                          return (
                            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5">
                              {/* Name */}
                              <div className="flex flex-col gap-0.5">
                                <span className="font-serif text-sm text-charcoal leading-snug">{item.name}</span>
                                {item.badge && (
                                  <span className="text-[10px] font-sans text-burgundy/70">{item.badge}</span>
                                )}
                              </div>

                              {/* Quantity input + quick-set */}
                              <div className="flex items-center gap-1.5 justify-center">
                                {/* Quick-set buttons */}
                                {!draft.is_unlimited && (
                                  <div className="flex gap-1 mr-1">
                                    {[6, 12, 24, 48].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() =>
                                          setInventoryDraft((prev) => ({
                                            ...prev,
                                            [item.id]: { quantity_set: String(n), is_unlimited: false },
                                          }))
                                        }
                                        className="text-[10px] font-sans text-charcoal/40 hover:text-burgundy hover:border-burgundy border border-charcoal/15 px-1.5 py-0.5 transition-colors"
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <input
                                  type="number"
                                  min={0}
                                  value={draft.is_unlimited ? "" : draft.quantity_set}
                                  disabled={draft.is_unlimited}
                                  placeholder={draft.is_unlimited ? "∞" : "0"}
                                  onChange={(e) =>
                                    setInventoryDraft((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id] ?? { is_unlimited: false }, quantity_set: e.target.value },
                                    }))
                                  }
                                  className={inputCls}
                                />
                              </div>

                              {/* Unlimited toggle */}
                              <div className="flex justify-center">
                                <button
                                  onClick={() =>
                                    setInventoryDraft((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        quantity_set: prev[item.id]?.quantity_set ?? "",
                                        is_unlimited: !(prev[item.id]?.is_unlimited ?? false),
                                      },
                                    }))
                                  }
                                  className={`w-10 h-5 rounded-full transition-colors relative ${
                                    draft.is_unlimited ? "bg-emerald-500" : "bg-charcoal/20"
                                  }`}
                                  title={draft.is_unlimited ? "Click to set a limit" : "Click for unlimited"}
                                >
                                  <span
                                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                                      draft.is_unlimited ? "left-5" : "left-0.5"
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Status */}
                              <div className="flex justify-center min-w-[90px]">
                                {!isConfigured ? (
                                  <span className="text-[10px] font-sans text-charcoal/30 tracking-wide">Not set</span>
                                ) : draft.is_unlimited ? (
                                  <span className="text-[10px] font-sans text-emerald-600 tracking-wide">Unlimited</span>
                                ) : isSoldOut ? (
                                  <span className="text-[10px] font-sans text-rose-600 font-medium tracking-wide">
                                    Sold Out
                                  </span>
                                ) : isLow ? (
                                  <span className="text-[10px] font-sans text-amber-600 font-medium tracking-wide">
                                    {remaining} left
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-sans text-charcoal/50 tracking-wide">
                                    {remaining} / {qtyNum}
                                    {sold > 0 && <span className="text-charcoal/30"> · {sold} sold</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom save bar */}
            <div className="mt-10 flex items-center justify-between bg-white border border-cream-dark px-6 py-4">
              <p className="text-xs font-sans text-charcoal/40">
                Changes only apply to today. Stock resets automatically at midnight — set counts fresh each morning.
              </p>
              <button
                onClick={saveInventory}
                disabled={inventorySaving}
                className={`text-xs tracking-widest uppercase font-sans px-6 py-2.5 transition-colors disabled:opacity-50 ${
                  inventorySaved
                    ? "bg-emerald-600 text-white"
                    : "bg-burgundy text-cream hover:bg-burgundy-dark"
                }`}
              >
                {inventorySaving ? "Saving…" : inventorySaved ? "Saved ✓" : "Save All"}
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
