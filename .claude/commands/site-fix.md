# EM Patisserie — Diagnose & Fix

Investigate and fix the issue described by the user. If no issue is described, run `/site-check` first to find issues, then fix the most critical one.

## Context
- **Project**: /Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site
- **Live URL**: https://cafe-site-shaunak1.vercel.app
- **Deploy**: `cd "/Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site" && vercel --prod`
- **Stack**: Next.js 16.2.6, Supabase, Vercel, Tailwind CSS v4

## Instructions

1. **Identify the problem** — If the user described an issue, investigate it. If not, check runtime logs, build output, and database for the most pressing problem.

2. **Diagnose** — Read the relevant source files, check error logs, and trace the root cause. Be specific: name the file, the line, and the function.

3. **Fix** — Edit the code to resolve the issue. Follow these project rules:
   - Use the brand colours (burgundy `#6a162b`, cream, charcoal, gold) via Tailwind class names, never raw hex
   - Headings use `font-serif`, UI text uses `font-sans`
   - Admin API routes check `x-admin-password` header against `process.env.ADMIN_PASSWORD`
   - Server-side DB access uses `supabaseAdmin` from `@/lib/supabase-admin` (never the anon client)
   - Money: `orders.total` and `order_items.price` are in paise (÷100 for display), `menu_items.price` is in rupees
   - No rounded corners on buttons — sharp rectangular edges throughout

4. **Verify** — Run `npm run build` to confirm the fix compiles. Check for TypeScript errors.

5. **Deploy** — Run `vercel --prod` from the project directory. Confirm deployment reaches READY state.

6. **Report** — State what was wrong, what you changed, and the deployment URL.

## Do NOT
- Change the admin password or any environment variable values
- Delete data from the database without explicit user confirmation
- Modify the Supabase schema without explaining why first
- Push to git without being asked (this project deploys from local filesystem via Vercel CLI, not git)
