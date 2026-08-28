-- Adds storage support for Strategic X product images uploaded on
-- add-product.html. Safe to run multiple times (idempotent). Run this in
-- the Supabase SQL Editor.
--
-- Lives inside strategic-x/ (not the repo root) so it travels with this
-- folder if/when Strategic X is extracted into its own project.
--
-- What this does:
--   1. Creates a public storage bucket "sx-product-images" for product
--      photo uploads (namespaced with the `sx-` prefix, same convention as
--      sx-shop-assets).
--   2. Allows only authenticated users to upload (INSERT), and only into a
--      folder path prefixed with their own auth.uid() (e.g.
--      "<user-id>/<product-id>/photo-1.jpg"), so one shop owner cannot
--      write into another owner's folder. Public read access is granted
--      so product photos can be displayed on public storefront pages
--      (e.g. Oshodi Market Online category/shop pages).
--   3. Allows owners to delete their own uploaded images (e.g. when
--      editing/removing a product later).'

insert into storage.buckets (id, name, public)
values ('sx-product-images', 'sx-product-images', true)
on conflict (id) do nothing;

drop policy if exists "Shop owners can upload their own product images" on storage.objects;
create policy "Shop owners can upload their own product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sx-product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Shop owners can delete their own product images" on storage.objects;
create policy "Shop owners can delete their own product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sx-product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects
for select
to public
using (bucket_id = 'sx-product-images');
