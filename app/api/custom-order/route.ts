import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendCustomOrderConfirmation, sendCustomOrderAdminNotification } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,19}$/;

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// POST — public: submit a custom cake enquiry
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name, email, phone,
    occasion, occasionOther,
    pickupDate, pickupTimeSlot,
    serves, flavors, dietary,
    messageOnCake, designDescription,
    referenceImageUrl, budgetRange, additionalNotes,
  } = body;

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !occasion || !pickupDate) {
    return NextResponse.json({ error: "Name, email, phone, occasion, and pickup date are required." }, { status: 400 });
  }

  if (!EMAIL_RE.test(String(email).trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!PHONE_RE.test(String(phone).trim())) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Reject obvious abuse: any free-text field over 2000 chars
  for (const [key, val] of Object.entries({ messageOnCake, designDescription, additionalNotes, flavors, dietary })) {
    if (typeof val === "string" && val.length > 2000) {
      return NextResponse.json({ error: `${key} is too long.` }, { status: 400 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("custom_order_requests")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      occasion,
      occasion_other: occasionOther?.trim() || null,
      pickup_date: pickupDate,
      pickup_time_slot: pickupTimeSlot || null,
      serves: serves || null,
      flavors: flavors || null,
      dietary: dietary || null,
      message_on_cake: messageOnCake?.trim() || null,
      design_description: designDescription?.trim() || null,
      reference_image_url: referenceImageUrl?.trim() || null,
      budget_range: budgetRange || null,
      additional_notes: additionalNotes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[CustomOrder] DB insert failed:", error);
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
  }

  // Send emails — don't let failures block the response
  await Promise.allSettled([
    sendCustomOrderConfirmation({ email: email.trim(), customerName: name.trim(), occasion, pickupDate }),
    sendCustomOrderAdminNotification({ requestId: data.id, name: name.trim(), email: email.trim(), phone: phone.trim(), occasion, occasionOther, pickupDate, pickupTimeSlot, serves, flavors, dietary, messageOnCake, designDescription, referenceImageUrl, budgetRange, additionalNotes }),
  ]);

  return NextResponse.json({ id: data.id });
}

// GET — admin: list all custom order requests
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("custom_order_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
