@AGENTS.md

# EM Patisserie & Artisanal Chocolates — Project Guide

## What This Is

A production café website for **EM Patisserie & Artisanal Chocolates**, a café in Kalyani Nagar, Pune (India). The site handles public browsing, online ordering with Razorpay payments, event signups, custom cake enquiries, and a full staff admin dashboard.

**Live URL:** https://cafe-site-shaunak1.vercel.app  
**Admin panel:** https://cafe-site-shaunak1.vercel.app/admin  
**Admin password:** `em-admin-2024`  
**Owner/developer:** Shaunak Deshpande (shaunakdeshpande42@gmail.com)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Animations | Framer Motion | ^12 |
| Database | Supabase (PostgreSQL) | ^2.106.1 |
| Payments | Razorpay | ^2.9.6 |
| Email | Resend | ^6.12.3 |
| State | Zustand | ^5 |
| Analytics | Vercel Analytics | ^2 |
| Fonts | Google Fonts (Inter + Playfair Display) | — |
| Deployment | Vercel | — |

**Build command:** `npm run build`  
**Dev command:** `npm run dev`

> **Note:** This is Next.js 16 — APIs and conventions may differ from older versions you know. Before writing any route handler or page code, check `node_modules/next/dist/docs/` for the current API.

---

## Brand Identity

### Colors (defined in Tailwind config / CSS)
```
burgundy      #6a162b   — primary brand colour, CTAs, accents
cream         (light off-white) — default page background, body text background
charcoal      (dark near-black) — body text, footer background, navbar when scrolled
gold          (warm gold) — decorative accents, specials banner
blush         (light pink) — section backgrounds
```

Always use these semantic names (`text-burgundy`, `bg-cream`, `text-charcoal`, etc.) — never raw hex values in JSX.

### Typography
- **Serif / display:** `font-serif` → Playfair Display (`--font-playfair`)
- **Body / UI:** `font-sans` → Inter (`--font-inter`)

Rule: headings, product names, section titles → `font-serif`. Navigation, labels, buttons, prices, metadata → `font-sans`.

### Logo
- File: `public/logo.svg`
- SVG viewBox: `0 0 384 245` (landscape ~1.57:1)
- Fill: `#6a162b` (burgundy) on transparent background
- **On dark backgrounds** (hero image, footer): apply `brightness-0 invert` CSS filter to turn it white
- **When navbar is transparent** (top of homepage, over the hero image): also apply `brightness-0 invert opacity-90`
- **On light backgrounds** (navbar when scrolled or on non-home pages): render as-is (natural burgundy)
- Always use `unoptimized` prop when rendering with `next/image`

### Button / UI conventions
- Primary CTA: `bg-burgundy text-cream` with `tracking-widest uppercase text-xs font-sans`
- Secondary/outline: `border border-cream/60 text-cream` or `border border-burgundy text-burgundy`
- All buttons use `transition-colors duration-200`
- No rounded corners on buttons — sharp rectangular edges throughout

---

## File Structure

```
app/
  page.tsx                    — Homepage (hero, about strip, featured items, gallery, map)
  layout.tsx                  — Root layout: Navbar + Footer + Analytics
  admin/page.tsx              — Staff admin dashboard (all tabs)
  menu/page.tsx               — DB-driven public menu with inventory badges
  order/page.tsx              — Checkout / order placement
  order/[id]/page.tsx         — Order confirmation page
  events/page.tsx             — Public events listing
  events/[id]/page.tsx        — Individual event page + signup form
  gallery/page.tsx            — Photo gallery
  custom-order/page.tsx       — Custom cake enquiry form

  api/
    menu/route.ts             — GET (public active items) · POST (admin create)
    menu/[id]/route.ts        — PATCH (admin update) · DELETE (admin soft-archive)
    menu/all/route.ts         — GET (admin: all items inc. archived)
    specials/route.ts         — GET (public: active special OR admin: all) · POST (admin create)
    specials/[id]/route.ts    — PATCH (admin update/toggle) · DELETE (admin hard-delete)
    inventory/route.ts        — GET (today's stock) · PUT (admin upsert)
    availability/route.ts     — GET (unavailable items) · POST (admin toggle)
    orders/route.ts           — GET (admin) · POST (create) · PATCH (advance status)
    checkout/route.ts         — Razorpay order creation
    verify-payment/route.ts   — Razorpay payment verification + order save
    events/route.ts           — GET (public) · POST (admin create) · DELETE (admin)
    events/signup/route.ts    — POST (public signup)
    custom-order/route.ts     — GET (admin list) · POST (public submit)
    custom-order/[id]/route.ts — PATCH (admin: update status/notes)
    reviews/route.ts          — GET (Google Places, cached 1 day)
    admin/analytics/route.ts  — GET (admin: KPIs, charts, top items)
    admin/export/route.ts     — GET (admin: CSV export of orders + signups)

components/
  Navbar.tsx                  — Context-aware navbar (transparent on homepage hero, opaque otherwise)
  Footer.tsx                  — Site footer with logo, links, socials
  CartDrawer.tsx              — Slide-in cart sidebar
  SpecialsBanner.tsx          — Animated announcement banner (slides up from hero bottom)
  FadeIn.tsx                  — Scroll-triggered fade-in wrapper
  ReviewsSection.tsx          — Google reviews carousel
  InstagramSection.tsx        — Instagram feed section
  EventSignupForm.tsx         — Event RSVP form
  PickupCalendar.tsx          — Pickup time slot selector

lib/
  supabase.ts                 — Browser-side Supabase client (anon key) + shared TypeScript type definitions (Order, OrderStatus, etc.)
  supabase-admin.ts           — Server-only Supabase client (service role key, bypasses RLS)
  cart-store.ts               — Zustand cart (persisted to localStorage as "em-cart")
  inventory-store.ts          — Zustand inventory cache (in-memory, refreshed per page load)
  menu-data.ts                — Static menu array (legacy; homepage still uses it for featuredItems)
  email.ts                    — Resend email helpers
  twilio.ts                   — Twilio SMS helpers (WhatsApp integration tabled/not live)

public/
  logo.svg                    — SVG logo
  gallery/                    — WebP gallery images (1.webp … 14.webp)
```

---

## Database Schema

All DB access goes through `supabaseAdmin` (service role, bypasses RLS). Never use the anon client for server-side writes.

### Tables

**`customers`** — created at order time
```sql
id uuid PK, name text, email text, created_at
```

**`orders`** — one per purchase
```sql
id uuid PK, customer_id → customers, 
status text CHECK ('received'|'preparing'|'ready'|'completed'),
total integer (paise — ₹1 = 100 paise),
pickup_time timestamptz, razorpay_order_id, razorpay_payment_id, created_at
```

**`order_items`** — line items per order
```sql
id uuid PK, order_id → orders CASCADE, item_id text, item_name text,
quantity integer, price integer (paise), created_at
```

**`menu_items`** — DB-driven menu (replaces static data for the menu page)
```sql
id text PK (slug, e.g. "mango-tart"), name text, description text,
price integer (₹, not paise), category text, image_url text,
badge text, note text, is_active boolean, sort_order integer, created_at
```
⚠️ `price` here is rupees, unlike `order_items.price` which is paise. Be careful with unit conversions.

**`daily_inventory`** — resets automatically at midnight (date-keyed)
```sql
id uuid PK, item_id text, date date, quantity_set integer, is_unlimited boolean,
UNIQUE(item_id, date)
```

**`unavailable_items`** — manual toggle to hide items from menu today
```sql
item_id text PK, note text, marked_at timestamptz
```

**`specials`** — announcement banners
```sql
id uuid PK, title text, subtitle text, link_text text, link_url text,
is_active boolean, ends_at date (nullable), created_at
```
Only one banner shown at a time — the most recent active non-expired one.

**`events`** — workshops / tastings
```sql
id uuid PK, title text, description text, event_date timestamptz,
image_url text, capacity integer, created_at
```

**`event_signups`**
```sql
id uuid PK, event_id → events CASCADE, name text, email text,
created_at
```
⚠️ The base `supabase-schema.sql` does not include a `phone` column. The admin CSV export references `s.phone` — this column may have been added manually to the live DB outside the schema file. Verify in Supabase before relying on it.

**`custom_order_requests`** — custom cake enquiries
```sql
id uuid PK, name, email, phone, occasion, pickup_date, serves, flavors,
dietary, message_on_cake, design_description, reference_image_url,
budget_range, additional_notes, status ('new'|'reviewing'|'confirmed'|'declined'),
admin_notes text, created_at
```

---

## Admin Authentication

All admin API routes are protected by a simple password header:

```typescript
const password = req.headers.get("x-admin-password");
if (password !== process.env.ADMIN_PASSWORD)
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

- **Header name:** `x-admin-password`
- **Value:** value of `ADMIN_PASSWORD` env var (`em-admin-2024`)
- There is no JWT, session, or cookie auth — just this header check on each request
- The admin page (`/admin`) stores the password in React state and passes it with every fetch

---

## State Management

### `useCartStore` (Zustand, persisted)
Persisted to `localStorage` under key `"em-cart"`. Survives page refreshes.
```typescript
items: CartItem[], isOpen: boolean
addItem(item), removeItem(id), updateQuantity(id, qty), clearCart()
openCart(), closeCart(), total(), itemCount()
```

### `useInventoryStore` (Zustand, in-memory)
Not persisted. Populated from `/api/inventory` on the menu page.
```typescript
entries: Record<string, InventoryEntry>, lastFetched: number | null
setEntries(items), getRemaining(itemId) → number | null, isSoldOut(itemId) → boolean
```
`getRemaining` returns `null` for unlimited items.

---

## Key Patterns & Conventions

### Navbar context-awareness
```typescript
const isHome = pathname === "/";
const isOpaque = scrolled || !isHome;
```
- Home page + top of scroll → transparent navbar, cream text, logo inverted white
- Any other page OR scrolled on home → opaque (`bg-cream/95 backdrop-blur`), charcoal text, natural logo

### API route auth pattern
Not all GETs are public. Check the file map for each route's access level.

```typescript
// Public GET (no auth check — anyone can call):
export async function GET() { ... }

// Admin-only GET (e.g. /api/orders, /api/menu/all, /api/admin/analytics):
export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ...
}

// Admin-only mutation (POST / PATCH / DELETE):
export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ...
}
```

### Specials GET dual-mode
`GET /api/specials` behaves differently based on admin header:
- No header / wrong password → returns single active special (or `null`)
- Correct `x-admin-password` → returns all specials, newest first

### Money handling
- `orders.total` and `order_items.price` are stored in **paise** (₹1 = 100)
- `menu_items.price` is stored in **rupees**
- Display with `₹${amount / 100}` for order values, `₹${price}` for menu items

### Soft delete for menu items
Archiving a menu item sets `is_active = false` (via `PATCH`), does not hard-delete. Restore with `PATCH { is_active: true }`.

### Inventory "sold" counting
Sold count is calculated at runtime: fetch today's order IDs → fetch `order_items` WHERE `order_id IN (...)` → sum quantities. Guard against empty arrays before calling `.in()` on Supabase.

### Session-based banner dismissal
`SpecialsBanner` uses `sessionStorage` key `special_dismissed_${special.id}`. Dismissed per session, per banner ID.

---

## Environment Variables

Set in Vercel project settings (Production only — preview deploys will fail if not also set for Preview).

```
NEXT_PUBLIC_SUPABASE_URL          Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY         Supabase service role key (server-only, bypasses RLS)
RAZORPAY_KEY_ID                   Razorpay test/live key ID
RAZORPAY_KEY_SECRET               Razorpay test/live secret
NEXT_PUBLIC_RAZORPAY_KEY_ID       Same as RAZORPAY_KEY_ID (exposed to client)
RESEND_API_KEY                    Resend email API key
ADMIN_PASSWORD                    Admin dashboard password (em-admin-2024)
GOOGLE_MAPS_API_KEY               Google Maps Places API key (for live reviews)
GOOGLE_PLACE_ID                   Google Place ID for the café
TWILIO_ACCOUNT_SID                Twilio (not yet live — WhatsApp integration tabled)
TWILIO_AUTH_TOKEN                 Twilio
TWILIO_PHONE_NUMBER               Twilio
```

> ⚠️ **Vercel env var scope:** All vars are currently set for "Production" only. Running `vercel` (preview deploy) without `--prod` will cause a build failure because `NEXT_PUBLIC_SUPABASE_URL` is undefined. Always deploy with `vercel --prod` or add vars to the Preview environment too.

---

## Deployment

```bash
# Always deploy from the project root:
cd "/Users/shaunakdeshpande/Documents/Website Vibe Coding /cafe-site"

# Production deploy (use this — Preview env vars aren't configured):
vercel --prod
```

The project is NOT git-connected on Vercel — it deploys directly from the local filesystem via the CLI. Uncommitted changes are included.

---

## Admin Dashboard Tabs

| Tab | Purpose |
|-----|---------|
| Dashboard | KPI cards, 7-day revenue chart, top items, upcoming events, CSV export |
| Orders | Real-time order queue with status pipeline (received→preparing→ready→completed). Auto-refreshes every 30s |
| Inventory | Per-item daily stock counts. Quick-set buttons (6/12/24/48). Unlimited toggle. Copy from Yesterday. Resets at midnight |
| Menu | Full CRUD for menu items. Archive/restore (soft delete). Category filter |
| Availability | Toggle items as unavailable for today with optional note |
| Events | Create/delete events with date, time, capacity, image |
| Custom Cakes | Review + triage custom cake enquiries (new/reviewing/confirmed/declined) |
| Specials | Create/edit/toggle/delete announcement banners shown on homepage |

---

## Pending / Future Work

### Tabled (not started)
- **Admin page protection** — Currently `/admin` is publicly accessible (password form visible to anyone). Plan: Next.js middleware + httpOnly session cookie. Visiting `/admin` without a valid cookie redirects to homepage. Staff log in via `/admin/login`, cookie persists 7 days. See conversation for full design.
- **WhatsApp notifications via Interakt** — Twilio code exists in `lib/twilio.ts` but is unused. Plan: integrate Interakt (WhatsApp Business API), create two templates (`em_order_confirmation`, `em_order_ready`), add `INTERAKT_API_KEY` env var.

### Phase 5 items (not yet done)
- Switch Razorpay from test keys to live keys
- Set `ADMIN_EMAIL` env var for custom order notification emails
- Replace `onboarding@resend.dev` sender with a custom domain email
- Mobile/tablet responsiveness audit
- Homepage `featuredItems` still uses static `lib/menu-data.ts` — should pull from DB

### Nice to haves
- Image upload for menu items (currently image_url is a text field for external URLs)
- Push notifications for new orders (currently polling every 30s)
- Multi-language support (English + Marathi/Hindi)

---

## Café Details

```
Name:     EM Patisserie & Artisanal Chocolates
Address:  Kalyani Nagar, Pune – 411006, Maharashtra
Phone:    +91 88578 74437
Hours:    Monday – Sunday, 10:00 AM – 10:00 PM
Map:      18.544375, 73.9004449 (Google Maps coordinates)
```

---

## Common Tasks

### Add a new menu item via admin
Go to `/admin` → Menu tab → "+ Add Item". It immediately appears on `/menu`.

### Add a specials banner
Go to `/admin` → Specials tab → "+ New Special". Only one banner shows at a time (most recent active one). Set an expiry date for time-limited promotions.

### Update inventory counts
Go to `/admin` → Inventory tab each morning. Use quick-set buttons or type manually. Toggle "Unlimited" for items like coffee/drinks. Click "Save All".

### Create a new API route (admin-protected)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... your logic
}
```

### Run a DB migration
Use the Supabase MCP tool (`execute_sql`) or go to supabase.com → SQL Editor. The `supabase-schema.sql` file has the base schema but may be behind the current DB state (tables like `menu_items`, `daily_inventory`, `specials`, `unavailable_items` were added after the initial schema).

---

## Website Manager Agent

An automated agent monitors and manages this website. It has two modes:

### Scheduled (Daily at 9 AM)
Task ID: `em-site-manager` — runs automatically every morning while Claude Code is open. Checks:
- Vercel deployment status (last 3 deploys, any failures)
- Build health (TypeScript / compilation errors)
- Runtime errors from the last 24 hours
- Database health (stuck orders, unreviewed custom requests, table sizes)
- Site accessibility (homepage, menu, checkout, API)
- Inventory status (set for today or not)
- Upcoming events and signup fill rates

Delivers a structured report with action items and improvement suggestions.

### On-Demand Commands
| Command | Purpose |
|---------|---------|
| `/site-check` | Run a full health check right now — same scope as the daily report |
| `/site-fix` | Diagnose and fix a specific issue (or the most critical one found) |
| `/site-suggest` | Analyse the codebase and suggest prioritised improvements |

### Data Lifecycle
- A Vercel cron job runs daily at 2 AM UTC (`/api/cron/cleanup-orders`)
- Deletes completed orders older than 30 days along with their customer data
- Requires `CRON_SECRET` env var to be set on Vercel (⚠️ not yet configured)
