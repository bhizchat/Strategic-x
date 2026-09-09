-- Automatically deletes orphaned rows from the shared "reviews" table
-- (owned/written to by the separate Oshodi Market Online storefront
-- codebase) whenever the sx_products row they belong to is deleted —
-- which happens when a vendor deletes a single product, AND when a
-- vendor deletes their whole account (sx_delete_account() in
-- sx-delete-account-schema.sql cascades: auth.users -> sx_shops ->
-- sx_products).
--
-- WHY THIS IS NEEDED: reviews.shop_key stores the REVIEWED PRODUCT's own
-- sx_products.id as text (confirmed in sx-reviews-reply-schema.sql), not
-- the shop's id, and there is no foreign key between the two tables
-- (reviews is owned by a different codebase). So deleting a product or a
-- whole account does NOT automatically remove its reviews — they'd be
-- left behind, pointing at a product id that no longer exists. If the
-- storefront (or anything else) ever lists/aggregates reviews without
-- checking the product still exists, these orphaned rows could surface
-- reviews for a product/shop that was deleted.
--
-- This trigger lives on sx_products (a table this repo owns), so it
-- requires NO changes on the Oshodi Market Online storefront side at
-- all — it fires regardless of why/how the sx_products row disappeared.
--
-- Safe to run multiple times (idempotent).

create or replace function public.sx_cleanup_product_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.reviews where shop_key = old.id::text;
  return old;
end;
$$;

drop trigger if exists sx_products_cleanup_reviews on public.sx_products;
create trigger sx_products_cleanup_reviews
after delete on public.sx_products
for each row
execute function public.sx_cleanup_product_reviews();
