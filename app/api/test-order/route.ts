import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Creates a real order without payment — used for testing until Razorpay is configured.
// This route is automatically hidden from the UI once Razorpay keys are set.
export async function POST(req: NextRequest) {
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

  const { error: ie } = await supabaseAdmin.from("order_items").insert(orderItems);
  if (ie) return NextResponse.json({ error: ie.message }, { status: 500 });

  return NextResponse.json({ orderId: order.id });
}
