import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Runs daily via Vercel cron (see vercel.json).
// Deletes completed orders that are 30+ days old.
// order_items are removed automatically via ON DELETE CASCADE.
// The linked customer row is removed afterwards (1-to-1 with each order).

export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel's cron scheduler
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // Find completed orders older than 30 days
  const { data: oldOrders, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("id, customer_id")
    .eq("status", "completed")
    .lt("created_at", cutoff.toISOString());

  if (fetchError) {
    console.error("Cleanup fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!oldOrders || oldOrders.length === 0) {
    return NextResponse.json({ deleted: 0, message: "Nothing to clean up." });
  }

  const orderIds    = oldOrders.map((o) => o.id);
  const customerIds = [...new Set(oldOrders.map((o) => o.customer_id).filter(Boolean))] as string[];

  // Delete orders — order_items cascade automatically
  const { error: ordersError } = await supabaseAdmin
    .from("orders")
    .delete()
    .in("id", orderIds);

  if (ordersError) {
    console.error("Cleanup orders delete error:", ordersError);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  // Delete the now-orphaned customer rows
  if (customerIds.length > 0) {
    const { error: customersError } = await supabaseAdmin
      .from("customers")
      .delete()
      .in("id", customerIds);

    if (customersError) {
      console.error("Cleanup customers delete error:", customersError);
      // Non-fatal — orders are already gone, log and continue
    }
  }

  console.log(`Cleanup: deleted ${oldOrders.length} completed orders and ${customerIds.length} customer records.`);
  return NextResponse.json({ deleted: oldOrders.length });
}
