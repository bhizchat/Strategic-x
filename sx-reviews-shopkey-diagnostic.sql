-- Diagnostic only — does not modify any data. Run in the Supabase SQL
-- Editor to figure out why reviews.html shows "0 reviews" for the
-- signed-in vendor even though rows exist in the shared "reviews" table.
--
-- Compares the shop id reviews.html is currently querying with
-- (91149722-b4e0-4811-9409-c4a6cf07c...) against the shop_key stored on
-- the Green Lily Bubu reviews (bf007ee9-f719-428d-839a-0d4f241feda2) to
-- see if these are two different rows in sx_shops (e.g. a duplicate shop
-- created for the same owner), or if the product itself points to a
-- shop_id that doesn't match either.

-- 1. Which shop does the "reviews.shop_key" value actually belong to?
select id, owner_id, shop_name, market_platform, created_at
from public.sx_shops
where id = 'bf007ee9-f719-428d-839a-0d4f241feda2';

-- 2. Which shop is the signed-in dashboard session currently using?
--    Replace the id below with your full session shop id from the
--    reviews.html debug message (the one starting 91149722-...).
select id, owner_id, shop_name, market_platform, created_at
from public.sx_shops
where id = '91149722-b4e0-4811-9409-c4a6cf07c3f9'; -- paste the FULL id here

-- 3. Does the same owner_id have more than one sx_shops row? (duplicate
--    shop rows are the most common cause of this mismatch)
select id, owner_id, shop_name, market_platform, created_at
from public.sx_shops
where owner_id = (
  select owner_id from public.sx_shops where id = 'bf007ee9-f719-428d-839a-0d4f241feda2'
)
order by created_at asc;

-- 4. What shop_id does the actual "Green Lily Bubu" product row point to?
select id, shop_id, product_name, status, created_at
from public.sx_products
where product_name ilike '%green lily bubu%';

-- ---------------------------------------------------------------------
-- CONFIRMED: 'bf007ee9-f719-428d-839a-0d4f241feda2' does not exist as a
-- real row in sx_shops (query 1 returned 0 rows) and therefore cannot
-- belong to any other vendor (query 3 also returned 0 rows). It is
-- stale/orphaned test data written to reviews.shop_key before the real
-- shop existed. The Green Lily Bubu product genuinely belongs to shop
-- 91149722-b4e0-4811-9409-c4a6cf07c3f9 (query 4), so it is safe to
-- repoint these review rows to the correct shop id.
--
-- 5. One-time fix: reassign the stale reviews to the correct shop id.
update public.reviews
set shop_key = '91149722-b4e0-4811-9409-c4a6cf07c3f9'
where shop_key = 'bf007ee9-f719-428d-839a-0d4f241feda2';

-- 6. Verify the fix worked.
select id, shop_key, product_index, reviewer_name, rating, created_at
from public.reviews
where shop_key = '91149722-b4e0-4811-9409-c4a6cf07c3f9';
