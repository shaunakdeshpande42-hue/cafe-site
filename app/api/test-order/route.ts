import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Dev-only route — creates a real order without payment, for testing the full flow
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_ORDERS) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { customerName, customerEmail, pickupTime, items, total } = await req.json();

  const { data: customer, error: ce } = await supabaseAdmin
    .from("customers")
    .insert({ name: customerName, email: customerEmail })
    .select()
    .single();
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 });

  const { data: order, error: oe } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_id: customer.id,
      status: "received",
      total: total * 100,
      pickup_time: pickupTime,
    })
    .select()
    .single();
  if (oe) return NextResponse.json({ error: oe.message }, { status: 500 });

  const orderItems = items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
    order_id: order.id,
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    price: item.price * 100,
  }));

  await supabaseAdmin.from("order_items").insert(orderItems);

  return NextResponse.json({ orderId: order.id });
}
