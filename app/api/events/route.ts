import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET — all events with signup count (admin only)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*, event_signups(count)")
    .order("event_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create a new event (admin only)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, event_date, image_url, capacity } = await req.json();

  if (!title?.trim() || !event_date) {
    return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      event_date,
      image_url: image_url?.trim() || null,
      capacity: capacity ? Number(capacity) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove an event by ID (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Event ID required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
