import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── PATCH ── admin: update a menu item ────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Only allow updating safe fields
  const allowed = ["name", "description", "price", "category", "badge", "note", "image_url", "is_active", "sort_order"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key] === "" ? null : body[key];
    }
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── DELETE ── admin: archive (soft-delete) a menu item ────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Soft-delete: set is_active = false so order history stays intact
  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
