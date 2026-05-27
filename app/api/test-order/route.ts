import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendOrderConfirmation } from "@/lib/twilio";
import { sendOrderConfirmationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a real order without payment — used for testing until Razorpay is configured.
export async function POST(req: NextRequest) {
  const { customerName, customerEmail, customerPhone, pickupTime, items, total, paymentMethod, specialInstructions } = await req.json();

  if (!customerEmail || !EMAIL_RE.test(String(customerEmail).trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const { data: customer, error: ce } = await supabaseAdmin
    .from("customers")
    .insert({ name: customerName, email: customerEmail, phone: customerPhone ?? null })
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
      payment_method: paymentMethod ?? "cash",
      special_instructions: specialInstructions || null,
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

  // Send notifications — awaited so the serverless function doesn't terminate early
  const itemCount = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

  await Promise.allSettled([
    // SMS confirmation
    customerPhone
      ? sendOrderConfirmation({
          phone: customerPhone,
          customerName,
          orderId: order.id,
          itemCount,
          total,
          pickupTime,
        })
      : Promise.resolve(),

    // Email confirmation
    sendOrderConfirmationEmail({
      email: customerEmail,
      customerName,
      orderId: order.id,
      items: orderItems,
      total,
      pickupTime,
    }),
  ]);

  return NextResponse.json({ orderId: order.id });
}
