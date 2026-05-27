import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── GET ── public: return the single most-recent active special
//          admin (with x-admin-password): return ALL specials
export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  const isAdmin = password === process.env.ADMIN_PASSWORD;

  if (isAdmin) {
    // Admin: return every special, newest first
    const { data, error } = await supabaseAdmin
      .from("specials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Public: return the single active, non-expired special
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("specials")
    .select("*")
    .eq("is_active", true)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

// ── POST ── admin: create a new special ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subtitle, link_text, link_url, ends_at } = await req.json();

  if (!title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("specials")
    .insert({
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      link_text: link_text?.trim() || "See it on the Menu",
      link_url:  link_url?.trim()  || "/menu",
      ends_at:   ends_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
