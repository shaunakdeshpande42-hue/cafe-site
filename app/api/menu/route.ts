import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── GET ── public: fetch all active menu items ────────────────────────────────
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

// ── POST ── admin: create a new menu item ────────────────────────────────────
export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, price, category, badge, note, image_url, sort_order } = body;

  if (!name?.trim() || !category?.trim() || !price)
    return NextResponse.json({ error: "name, category and price are required" }, { status: 400 });

  // Auto-generate slug from name
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  // Ensure slug is unique
  const { data: existing } = await supabaseAdmin
    .from("menu_items")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  const finalId = existing ? `${id}-${Date.now()}` : id;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      id: finalId,
      name: name.trim(),
      description: description?.trim() ?? "",
      price: Number(price),
      category: category.trim(),
      badge: badge?.trim() || null,
      note: note?.trim() || null,
      image_url: image_url?.trim() || null,
      sort_order: sort_order ?? 999,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
