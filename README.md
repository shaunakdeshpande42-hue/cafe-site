# EM Patisserie & Artisanal Chocolates

**Full-stack café website** — online ordering, custom cake enquiries, event sign-ups, and a staff admin dashboard.

Live site: [empatisserie.com](https://empatisserie.com) &nbsp;·&nbsp; Staging: [cafe-site-shaunak1.vercel.app](https://cafe-site-shaunak1.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + Framer Motion |
| Database | Supabase (PostgreSQL + Storage) |
| Payments | Razorpay |
| Email | Resend |
| Deployment | Vercel |
| Analytics | Vercel Analytics |

---

## Features

- **Menu** — category tabs, live inventory/availability, Add to Cart
- **Cart & Checkout** — Zustand cart, Razorpay online payment, cash-on-pickup, scheduled pickup date/time
- **Custom Cake Orders** — enquiry form with validation, Supabase-stored requests
- **Events** — upcoming events listing, per-event sign-up form with capacity tracking
- **Gallery** — photo grid
- **Admin Dashboard** — orders, menu management, inventory, availability overrides, event management, analytics, CSV export
- **Specials Banner** — animated promotional strip on the homepage hero
- **SEO** — per-page metadata, LocalBusiness JSON-LD schema, sitemap, robots.txt

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ADMIN_PASSWORD` | Password for the admin dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RESEND_API_KEY` | Resend API key for emails |
| `FROM_EMAIL` | Sender address for order emails |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. https://empatisserie.com) |

---

## Milestones

| Milestone | Target | Status |
|---|---|---|
| [v1.0 — Public Launch](https://github.com/shaunakdeshpande42-hue/cafe-site/milestone/1) | Jun 2026 | 🔵 In progress |
| [v1.1 — Post-Launch SEO & Polish](https://github.com/shaunakdeshpande42-hue/cafe-site/milestone/2) | Jul 2026 | ⚪ Planned |
| [v1.2 — Payments & Messaging](https://github.com/shaunakdeshpande42-hue/cafe-site/milestone/3) | Aug 2026 | ⚪ Planned |

---

## Admin Access

The admin dashboard lives at `/admin`. It is protected by middleware — unauthenticated requests redirect to `/admin/login`.

> **Never commit `.env.local` or any secrets to this repository.**

