-- Creates the "sx_shops" table: one row per Strategic X shop, automatically
-- inserted when a shop owner completes onboarding (Complete Setup on
-- onboarding-step3.html). This is what will eventually power a real shop
-- directory on the storefront (e.g. "Check All Shops" for Oshodi Market
-- Online), once a product-adding flow also exists — a shop row with 0
-- products won't yet appear in any product listing, since those are built
-- by flattening each shop's products.
--
-- Lives inside strategic-x/ (not the repo root) so it travels with this
-- folder if/when Strategic X is extracted into its own project.
--
-- SECURITY: this table stores a mix of public (shop name, category,
-- tagline, location, phone, WhatsApp, logo/banner) and private (email,
-- National ID card storage path) fields. Only the owner can read/write
-- their own full row (RLS below). Public/anon readers get access ONLY
-- through the `sx_shops_public` view, which deliberately excludes email
-- and id_card_path.
--
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL
-- Editor (after sx-shop-assets-schema.sql and sx-verification-docs-schema.sql,
-- since this references the same uploaded logo/banner/ID paths).

create table if not exists public.sx_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  whatsapp text not null,
  category text not null,
  market_platform text not null,
  location text not null,
  tagline text,
  logo_url text,
  banner_url text,
  id_card_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

alter table public.sx_shops enable row level security;

drop policy if exists "Owners can insert their own shop" on public.sx_shops;
create policy "Owners can insert their own shop"
on public.sx_shops
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can view their own shop" on public.sx_shops;
create policy "Owners can view their own shop"
on public.sx_shops
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can update their own shop" on public.sx_shops;
create policy "Owners can update their own shop"
on public.sx_shops
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Public-safe view: excludes email and id_card_path (sensitive PII) so it
-- can be exposed to anon/public readers for shop-directory / search
-- purposes without leaking contact or identity-document data.
create or replace view public.sx_shops_public as
select
  id,
  shop_name,
  category,
  market_platform,
  location,
  tagline,
  phone,
  whatsapp,
  logo_url,
  banner_url,
  created_at
from public.sx_shops;

grant select on public.sx_shops_public to anon, authenticated;
