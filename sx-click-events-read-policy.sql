-- Grants the vendor dashboard (authenticated role) read access to the
-- shared "click_events" table, which is owned/written to by the separate
-- Oshodi Market Online storefront codebase to track shop/product
-- analytics events. It was previously only readable by "anon" (for the
-- storefront's own use), so the authenticated dashboard session got 0
-- rows back — same root cause as the earlier "reviews" table issue.
--
-- Run this once in the Supabase SQL Editor.
--
-- Confirmed columns on click_events: id, event_type, event_label,
-- source_page, product_name, shop_key, product_index, target_url,
-- phone_number, metadata, created_at.
--
-- IMPORTANT: shop_key and product_index are NOT populated by the
-- storefront (always null). The real identifier is embedded in
-- target_url instead:
--   Product-scoped events (Product clicks, Calls, Messages)
--     -> target_url contains "id=<sx_products.id>"
--   Shop-scoped events (Shop clicks / Visit Shop)
--     -> target_url contains "sxshop=<sx_shops.id>"
--
-- Event mapping used by dashboard.html / my-shop.html:
--   Shop Views     -> event_type = 'Product clicks' AND event_label = 'View Details'
--                   OR event_type = 'Shop clicks'    AND event_label = 'Visit Shop'
--   WhatsApp Clicks -> event_type = 'Messages' AND event_label = 'WhatsApp Message'
--   Contact Clicks  -> event_type = 'Calls'    AND event_label = 'Call for this Item'

grant select on public.click_events to authenticated;

drop policy if exists "Authenticated users can read click events" on public.click_events;
create policy "Authenticated users can read click events"
on public.click_events
for select
to authenticated
using (true);
