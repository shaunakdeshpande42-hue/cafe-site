import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/export?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const [ordersRes, signupsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, total, status, created_at, pickup_time, customers(name, email, phone), order_items(item_name, quantity, price)")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("event_signups")
      .select("name, email, phone, created_at, events(title, event_date)")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    orders: ordersRes.data ?? [],
    signups: signupsRes.data ?? [],
    meta: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      orderCount: (ordersRes.data ?? []).length,
      signupCount: (signupsRes.data ?? []).length,
    },
  });
}
