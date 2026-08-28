-- The "reviews" table itself is owned by the separate Oshodi Market
-- Online storefront codebase (it also writes click_events/search_queries
-- into the same Supabase project), so this file does NOT create or alter
-- the table — it only adds one additional RLS policy so the Strategic X
-- vendor dashboard (reviews.html / dashboard.html) can read review rows
-- for the signed-in owner's shop.
--
-- Symptom this fixes: reviews are visible in Supabase Table Editor and on
-- the public storefront product page (which reads as the "anon" role),
-- but the vendor dashboard's Reviews page shows "0 reviews" / a blank
-- state, because the table's existing RLS policy only grants SELECT to
-- "anon" — Postgres RLS defaults to deny-all per role once RLS is
-- enabled, so the "authenticated" role (a logged-in vendor's session)
-- gets zero rows back even though the same data is public.
--
-- This policy is read-only and does not change who can insert/update
-- reviews (that stays owned by the storefront's existing policies). Since
-- reviews are already publicly readable via the anon policy, allowing
-- authenticated reads too does not expose any new data.
--
-- Safe to run multiple times. Run this in the Supabase SQL Editor.

drop policy if exists "Authenticated users can read reviews" on public.reviews;
create policy "Authenticated users can read reviews"
on public.reviews
for select
to authenticated
using (true);
