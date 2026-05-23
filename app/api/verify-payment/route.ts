import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      customerEmail,
      pickupTime,
      items,
      total,
    } = await req.json();

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
      .insert({ name: customerName, email: customerEmail })
      .select()
      .single();

    if (customerError) throw customerError;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customer.id,
        status: "received",
        total: total * 100, // convert to paise
        pickup_time: pickupTime,
        razorpay_order_id,
        razorpay_payment_id,
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

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
