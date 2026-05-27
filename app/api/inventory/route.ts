import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface InventoryEntry {
  item_id: string;
  item_name: string;
  is_set: boolean;       // true if employee has configured this item today
  is_unlimited: boolean;
  quantity_set: number | null;
  sold: number;
  remaining: number | null; // null = unlimited
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ── GET ── public: today's stock levels (or any date via ?date=YYYY-MM-DD) ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD, defaults to today

  const queryDate = dateParam ?? new Date().toISOString().slice(0, 10);

  // Fetch inventory rows for the requested date
  const { data: invRows, error: invErr } = await supabaseAdmin
    .from("daily_inventory")
    .select("item_id, item_name, quantity_set, is_unlimited")
    .eq("date", queryDate);

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  // Compute sold quantities from today's completed/active orders
  // (only relevant for today; for past dates this is informational)
  const soldMap: Record<string, number> = {};
  if (queryDate === new Date().toISOString().slice(0, 10)) {
    const { start, end } = todayRange();
    const { data: todayOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .gte("created_at", start)
      .lt("created_at", end);

    const orderIds = (todayOrders ?? []).map((o) => o.id);
    if (orderIds.length > 0) {
      const { data: soldItems } = await supabaseAdmin
        .from("order_items")
        .select("item_id, quantity")
        .in("order_id", orderIds);

      for (const si of soldItems ?? []) {
        soldMap[si.item_id] = (soldMap[si.item_id] ?? 0) + si.quantity;
      }
    }
  }

  const items: InventoryEntry[] = (invRows ?? []).map((row) => {
    const sold = soldMap[row.item_id] ?? 0;
    const remaining =
      row.is_unlimited ? null : Math.max(0, (row.quantity_set ?? 0) - sold);
    return {
      item_id: row.item_id,
      item_name: row.item_name,
      is_set: true,
      is_unlimited: row.is_unlimited,
      quantity_set: row.quantity_set,
      sold,
      remaining,
    };
  });

  return NextResponse.json({ date: queryDate, items });
}

// ── PUT ── admin: upsert inventory for today ─────────────────────────────────
export async function PUT(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items }: {
    items: { item_id: string; item_name: string; quantity_set: number | null; is_unlimited: boolean }[]
  } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const rows = items.map((item) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    date: today,
    quantity_set: item.is_unlimited ? null : (item.quantity_set ?? null),
    is_unlimited: item.is_unlimited,
  }));

  const { error } = await supabaseAdmin
    .from("daily_inventory")
    .upsert(rows, { onConflict: "item_id,date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, saved: rows.length });
}
