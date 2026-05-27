import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReadyForPickup } from "@/lib/twilio";
import { sendReadyForPickupEmail } from "@/lib/email";

// GET — admin: fetch all orders with items + customer
export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, customers(*), order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — admin: advance order status
export async function PATCH(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status } = await req.json();
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send "ready for pickup" notifications when order is marked ready
  if (status === "ready") {
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, customers(name, email, phone)")
        .eq("id", orderId)
        .single();

      const raw = order?.customers;
      const customer = (Array.isArray(raw) ? raw[0] : raw) as {
        name: string;
        email: string;
        phone: string | null;
      } | null;

      if (customer) {
        await Promise.allSettled([
          // SMS
          customer.phone
            ? sendReadyForPickup({
                phone: customer.phone,
                customerName: customer.name,
                orderId,
              })
            : Promise.resolve(),

          // Email
          sendReadyForPickupEmail({
            email: customer.email,
            customerName: customer.name,
            orderId,
          }),
        ]);
      }
    } catch (err) {
      // Never let notification failure affect the status update
      console.error("[Notifications] Failed for ready notification:", err);
    }
  }

  return NextResponse.json({ success: true });
}
