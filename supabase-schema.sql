-- EM Patisserie — Database Schema
-- Run this in: supabase.com → your project → SQL Editor → New query

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  status text not null default 'received'
    check (status in ('received', 'preparing', 'ready', 'completed')),
  total integer not null, -- stored in paise (₹1 = 100 paise)
  pickup_time timestamptz,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz default now()
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  quantity integer not null,
  price integer not null, -- stored in paise
  created_at timestamptz default now()
);

-- Events (Phase 4)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  image_url text,
  capacity integer,
  created_at timestamptz default now()
);

-- Event Signups (Phase 4)
create table if not exists event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table events enable row level security;
alter table event_signups enable row level security;

-- RLS Policies
create policy "insert customers" on customers for insert with check (true);
create policy "insert orders" on orders for insert with check (true);
create policy "insert order_items" on order_items for insert with check (true);
create policy "read orders" on orders for select using (true);
create policy "read order_items" on order_items for select using (true);
create policy "update orders" on orders for update using (true);
create policy "read events" on events for select using (true);
create policy "insert event_signups" on event_signups for insert with check (true);
