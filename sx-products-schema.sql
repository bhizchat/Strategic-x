-- Creates the "sx_products" table: one row per product a shop owner
-- publishes or saves as a draft from add-product.html. This is what will
-- eventually power real product listings on the storefront (e.g. category
-- pages and a shop's own product grid on Oshodi Market Online), once
-- storefront pages are wired to read from it (see sx_products_public view
-- below).
--
-- Lives inside strategic-x/ (not the repo root) so it travels with this
-- folder if/when Strategic X is extracted into its own project.
--
-- SECURITY: shop owners can only insert/select/update/delete their own
-- products (RLS below, scoped by owner_id = auth.uid()). Public/anon
-- readers get access ONLY through the `sx_products_public` view, which
-- only exposes rows with status = 'published' (drafts stay private to the
-- owner) and joins in the minimal shop info needed to render a listing.
--
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL
-- Editor (after sx-shops-schema.sql, since this references sx_shops).

create table if not exists public.sx_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.sx_shops(id) on delete cascade,
  product_name text not null,
  category text not null,
  subcategory text,
  brand text,
  sku text,
  description text not null,
  tags text[] not null default '{}',
  images text[] not null default '{}',
  selling_price numeric(12, 2) not null,
  compare_price numeric(12, 2),
  stock_quantity integer not null default 0,
  condition text not null default 'new' check (condition in ('new', 'used', 'refurbished')),
  warranty text,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adds subcategory/brand/sku to tables created before these columns
-- existed (safe to run multiple times).
alter table public.sx_products add column if not exists subcategory text;
alter table public.sx_products add column if not exists brand text;
alter table public.sx_products add column if not exists sku text;

create index if not exists sx_products_owner_id_idx on public.sx_products (owner_id);
create index if not exists sx_products_shop_id_idx on public.sx_products (shop_id);
create index if not exists sx_products_category_idx on public.sx_products (category);
create index if not exists sx_products_status_idx on public.sx_products (status);

alter table public.sx_products enable row level security;

drop policy if exists "Owners can insert their own products" on public.sx_products;
create policy "Owners can insert their own products"
on public.sx_products
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can view their own products" on public.sx_products;
create policy "Owners can view their own products"
on public.sx_products
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can update their own products" on public.sx_products;
create policy "Owners can update their own products"
on public.sx_products
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners can delete their own products" on public.sx_products;
create policy "Owners can delete their own products"
on public.sx_products
for delete
to authenticated
using (owner_id = auth.uid());

-- Public-safe view: only published products, joined with the shop fields a
-- storefront product page needs — including shop name, market platform,
-- shop logo, location, phone and WhatsApp number, so the storefront can
-- render "WhatsApp Message" / "Call for this Item" actions the same way
-- for every product, whether it was added via the portal or hardcoded.
-- This is the ONLY thing the Oshodi Market Online storefront (or any
-- other market_platform storefront) should ever query against for
-- product listings — never the base sx_products table, which also holds
-- drafts and is owner-restricted.
--
-- Dropped and recreated (rather than CREATE OR REPLACE) because Postgres
-- disallows inserting/reordering columns in the middle of an existing
-- view via REPLACE — only appending at the end is allowed. Safe to drop
-- since nothing else creates dependent objects on top of this view.
drop view if exists public.sx_products_public;
create view public.sx_products_public as
select
  p.id,
  p.product_name,
  p.category,
  p.subcategory,
  p.brand,
  p.sku,
  p.description,
  p.tags,
  p.images,
  p.selling_price,
  p.compare_price,
  p.stock_quantity,
  p.condition,
  p.warranty,
  p.created_at,
  s.id as shop_id,
  s.shop_name,
  s.market_platform,
  s.logo_url as shop_logo_url,
  s.location as shop_location,
  s.phone as shop_phone,
  s.whatsapp as shop_whatsapp
from public.sx_products p
join public.sx_shops s on s.id = p.shop_id
where p.status = 'published';

grant select on public.sx_products_public to anon, authenticated;
