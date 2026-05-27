import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";

// GET — returns all currently unavailable item IDs + notes
// Used by the menu page (public, short cache)
export const revalidate = 0; // always fresh

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("unavailable_items")
    .select("item_id, note, marked_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unavailable: data ?? [] });
}

// POST — mark/unmark an item as unavailable (admin only)
export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("x-admin-password");
  if (!auth || auth !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_id, available, note } = await req.json();

  if (available) {
    // Mark available — remove from table
    const { error } = await supabaseAdmin
      .from("unavailable_items")
      .delete()
      .eq("item_id", item_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Mark unavailable — upsert
    const { error } = await supabaseAdmin
      .from("unavailable_items")
      .upsert({ item_id, note: note ?? null, marked_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
