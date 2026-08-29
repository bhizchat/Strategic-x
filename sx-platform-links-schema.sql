-- Creates the "platform_links" table: a tiny shared config table holding
-- the current public base URL for each market platform Strategic X shops
-- can sell on (currently just "oshodi-market-online"). Powers the
-- "View Shop" button on dashboard.html.
--
-- Why a shared base URL instead of one link per shop: the Oshodi Market
-- Online storefront's own click_events data already shows its shop page
-- route convention is "shops.html?sxshop=<sx_shops.id>" (confirmed from a
-- real "Shop clicks"/"Visit Shop" event's target_url). Since Strategic X
-- already knows every shop's id, the ONLY missing piece is the storefront's
-- current base URL (e.g. a local dev address today, a real domain once it
-- ships) — so the storefront only needs to keep ONE row up to date here,
-- not one per shop.
--
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL
-- Editor.

create table if not exists public.platform_links (
  market_platform text primary key,
  base_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_links enable row level security;

-- Strategic X's dashboard (logged-in vendors) needs to read the base_url
-- to build the "View Shop" link.
grant select on public.platform_links to anon, authenticated;

drop policy if exists "Anyone can read platform links" on public.platform_links;
create policy "Anyone can read platform links"
on public.platform_links
for select
to anon, authenticated
using (true);

-- The Oshodi Market Online storefront (unauthenticated, same as how it
-- writes to click_events/reviews) needs to be able to keep its own
-- base_url row up to date.
grant insert, update on public.platform_links to anon;

drop policy if exists "Anyone can upsert platform links" on public.platform_links;
create policy "Anyone can upsert platform links"
on public.platform_links
for all
to anon
using (true)
with check (true);

notify pgrst, 'reload schema';
