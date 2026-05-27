import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendOrderConfirmation } from "@/lib/twilio";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ── Stock validation helper ───────────────────────────────────────────────────
async function checkStock(
  items: { id: string; name: string; quantity: number }[]
): Promise<{ ok: boolean; conflicts: { name: string; requested: number; remaining: number }[] }> {
  const today = new Date().toISOString().slice(0, 10);
  const itemIds = items.map((i) => i.id);

  // Get inventory settings for today
  const { data: invRows } = await supabaseAdmin
    .from("daily_inventory")
    .select("item_id, quantity_set, is_unlimited")
    .eq("date", today)
    .in("item_id", itemIds);

  if (!invRows || invRows.length === 0) return { ok: true, conflicts: [] };

  // Get today's sold counts
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);

  const { data: todayOrders } = await supabaseAdmin
    .from("orders")
    .select("id")
    .gte("created_at", startOfDay.toISOString())
    .lt("created_at", endOfDay.toISOString());

  const soldMap: Record<string, number> = {};
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

  const conflicts: { name: string; requested: number; remaining: number }[] = [];
  for (const inv of invRows) {
    if (inv.is_unlimited) continue;
    const sold = soldMap[inv.item_id] ?? 0;
    const remaining = Math.max(0, (inv.quantity_set ?? 0) - sold);
    const ordered = items.find((i) => i.id === inv.item_id);
    if (ordered && ordered.quantity > remaining) {
      conflicts.push({ name: ordered.name, requested: ordered.quantity, remaining });
    }
  }

  return { ok: conflicts.length === 0, conflicts };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      customerEmail,
      customerPhone,
      pickupTime,
      items,
      total,
      specialInstructions,
    } = await req.json();

    if (!customerEmail || !EMAIL_RE.test(String(customerEmail).trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // ── Hard stock check (last line of defence before committing the order) ──
    const stockCheck = await checkStock(items ?? []);
    if (!stockCheck.ok) {
      const detail = stockCheck.conflicts
        .map((c) => `${c.name}: ordered ${c.requested}, only ${c.remaining} left`)
        .join("; ");
      return NextResponse.json(
        { error: `Some items are no longer available: ${detail}` },
        { status: 409 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret === "REPLACE_ME") {
      return NextResponse.json({ error: "Razorpay not configured." }, { status: 503 });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Create customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({ name: customerName, email: customerEmail, phone: customerPhone ?? null })
      .select()
      .single();

    if (customerError) throw customerError;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customer.id,
        status: "received",
        total: total * 100,
        pickup_time: pickupTime,
        payment_method: "online",
        razorpay_order_id,
        razorpay_payment_id,
        special_instructions: specialInstructions || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
      order_id: order.id,
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price * 100,
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    // Send notifications — awaited so the serverless function doesn't terminate early
    const itemCount = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

    await Promise.allSettled([
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
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
