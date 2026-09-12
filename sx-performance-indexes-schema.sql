-- Adds missing indexes on columns that portal-next's most-used queries
-- filter/search by, found by auditing every .eq()/.in()/.ilike() call in
-- portal-next/src/lib/shop.ts. Safe to run multiple times (idempotent) —
-- CREATE INDEX IF NOT EXISTS is purely additive: it doesn't change any
-- existing data or app behavior, only speeds up reads (at a small cost to
-- write speed + storage, which is negligible for tables this size). Run
-- this in the Supabase SQL Editor.
--
-- Already indexed, confirmed via the existing schema files (no action
-- needed, listed here for completeness of the audit):
--   sx_products.owner_id / shop_id / category / status  (sx-products-schema.sql)
--   sx_shop_members.shop_id / user_id                    (sx-shop-members-schema.sql)
--   sx_shops.owner_id                                    (implicit unique index from
--                                                          `unique (owner_id)` in sx-shops-schema.sql)
--   platform_links.market_platform                       (primary key)
--
-- Missing indexes found (this file adds them):
--
--   1. reviews.shop_key — filtered via `.in('shop_key', productIds)` in THREE
--      places (loadShopStats, loadShopOverviewStats, loadShopReviews in
--      portal-next/src/lib/shop.ts), on every dashboard/my-shop/reviews page
--      load. "reviews" is a table shared with the separate Oshodi Market
--      Online storefront codebase (not created by this repo), so no index
--      has ever been added to it by our migrations — this is the single
--      most-hit unindexed filter column in the whole app.
--
--   2/3. click_events.event_type and click_events.product_name — both
--      filtered via `.in(...)` inside loadShopStats' WhatsApp/Calls click
--      counting query.
--
--   4. click_events.target_url — filtered via `.ilike('%...%')` (leading
--      wildcard) inside loadShopStats' "Shop Views"/contact-click query. A
--      normal btree index (like the ones above) CANNOT be used by Postgres
--      for a leading-wildcard ILIKE — it needs a trigram (pg_trgm) GIN
--      index instead, which is what's created below.

create index if not exists reviews_shop_key_idx on public.reviews (shop_key);
create index if not exists click_events_event_type_idx on public.click_events (event_type);
create index if not exists click_events_product_name_idx on public.click_events (product_name);

create extension if not exists pg_trgm;
create index if not exists click_events_target_url_trgm_idx
  on public.click_events using gin (target_url gin_trgm_ops);
