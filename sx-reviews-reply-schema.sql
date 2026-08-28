-- Adds shop-reply support to the shared "reviews" table (owned/written to
-- by the separate Oshodi Market Online storefront codebase, read/replied
-- to here in the Strategic X vendor dashboard).
--
-- Run this once in the Supabase SQL Editor.

-- 1. New columns to store the vendor's reply.
alter table public.reviews add column if not exists shop_reply text;
alter table public.reviews add column if not exists shop_reply_at timestamptz;

-- 2. Grant UPDATE privilege on the table to the "authenticated" role.
--    Without this, Postgres blocks the query with "permission denied for
--    table reviews" before RLS policies are even evaluated — RLS only
--    narrows down rows within a privilege you already have via GRANT.
grant update on public.reviews to authenticated;

-- 3. Allow a signed-in vendor to update ONLY the reviews that belong to
--    a product in their own shop. IMPORTANT: shop_key on this table
--    stores the REVIEWED PRODUCT's own sx_products.id as text (confirmed
--    with the Oshodi Market Online storefront codebase), NOT the shop's
--    own id — so ownership must be checked via a product owned by this
--    shop, not by comparing shop_key directly to sx_shops.id. Without
--    this, RLS would silently block the update (0 rows affected, no
--    error) exactly like the earlier read-access issue.
drop policy if exists "Shop owners can reply to their reviews" on public.reviews;
create policy "Shop owners can reply to their reviews"
on public.reviews
for update
to authenticated
using (
  shop_key in (
    select p.id::text
    from public.sx_products p
    join public.sx_shops s on s.id = p.shop_id
    where s.owner_id = auth.uid()
  )
)
with check (
  shop_key in (
    select p.id::text
    from public.sx_products p
    join public.sx_shops s on s.id = p.shop_id
    where s.owner_id = auth.uid()
  )
);

-- 4. Force PostgREST to reload its schema cache immediately, otherwise
--    the new columns can return "Could not find the 'shop_reply' column
--    of 'reviews' in the schema cache" for a short while after adding
--    them (Supabase usually picks up new columns within ~30-60s on its
--    own, but this makes it instant).
notify pgrst, 'reload schema';
