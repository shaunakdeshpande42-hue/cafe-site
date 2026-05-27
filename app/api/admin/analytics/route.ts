import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run all queries in parallel
  const [
    ordersAllRes,
    customersRes,
    eventsRes,
    topItemsRes,
    recentSignupsRes,
  ] = await Promise.all([
    // All orders (for revenue calcs + day chart)
    supabaseAdmin
      .from("orders")
      .select("id, total, status, created_at")
      .gte("created_at", weekStart.toISOString())
      .order("created_at", { ascending: true }),

    // Total customers
    supabaseAdmin
      .from("customers")
      .select("id, created_at", { count: "exact" }),

    // Upcoming events with signup counts
    supabaseAdmin
      .from("events")
      .select("id, title, event_date, capacity, event_signups(count)")
      .gte("event_date", now.toISOString())
      .order("event_date", { ascending: true })
      .limit(5),

    // Top items — all time
    supabaseAdmin
      .from("order_items")
      .select("item_name, quantity")
      .limit(500),

    // Recent event signups
    supabaseAdmin
      .from("event_signups")
      .select("name, email, created_at, events(title)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = ordersAllRes.data ?? [];
  const totalCustomers = customersRes.count ?? 0;
  const upcomingEvents = eventsRes.data ?? [];
  const allItems = topItemsRes.data ?? [];
  const recentSignups = recentSignupsRes.data ?? [];

  // ── Revenue + order counts ──────────────────────────────────────────────

  const toDay = (iso: string) => iso.slice(0, 10);

  const todayStr = toDay(now.toISOString());
  const monthStr = now.toISOString().slice(0, 7);

  const ordersTodayList = orders.filter(o => toDay(o.created_at) === todayStr);
  const revenueToday = ordersTodayList.reduce((s, o) => s + o.total, 0);

  const ordersThisWeek = orders.length;
  const revenueThisWeek = orders.reduce((s, o) => s + o.total, 0);

  // For month we need a separate fetch — use week data as proxy if month === week
  const ordersThisMonth = orders.filter(o => o.created_at.slice(0, 7) === monthStr);
  const revenueThisMonth = ordersThisMonth.reduce((s, o) => s + o.total, 0);

  // Active orders right now (not completed)
  const activeOrders = orders.filter(o => o.status !== "completed");

  // Status breakdown (all time from week window)
  const statusBreakdown: Record<string, number> = { received: 0, preparing: 0, ready: 0, completed: 0 };
  for (const o of orders) statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1;

  // ── 7-day chart ─────────────────────────────────────────────────────────

  const days: { date: string; label: string; orders: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = toDay(d.toISOString());
    const dayOrders = orders.filter(o => toDay(o.created_at) === key);
    days.push({
      date: key,
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
    });
  }

  // ── Top items ────────────────────────────────────────────────────────────

  const itemMap: Record<string, number> = {};
  for (const item of allItems) {
    itemMap[item.item_name] = (itemMap[item.item_name] ?? 0) + item.quantity;
  }
  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, qty]) => ({ name, qty }));

  return NextResponse.json({
    kpis: {
      revenueToday: revenueToday / 100,
      ordersToday: ordersTodayList.length,
      revenueThisWeek: revenueThisWeek / 100,
      ordersThisWeek,
      revenueThisMonth: revenueThisMonth / 100,
      ordersThisMonth: ordersThisMonth.length,
      totalCustomers,
      activeOrders: activeOrders.length,
      upcomingEventsCount: upcomingEvents.length,
    },
    statusBreakdown,
    days,
    topItems,
    upcomingEvents: upcomingEvents.map(e => ({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      capacity: e.capacity,
      signups: (e.event_signups as { count: number }[])?.[0]?.count ?? 0,
    })),
    recentSignups: recentSignups.map(s => ({
      name: s.name,
      email: s.email,
      created_at: s.created_at,
      event_title: (Array.isArray(s.events) ? (s.events[0] as { title: string } | undefined)?.title : (s.events as { title: string } | null)?.title) ?? "—",
    })),
  });
}
