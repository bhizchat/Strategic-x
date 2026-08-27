-- Adds PRIVATE storage support for Strategic X shop-owner identity
-- verification documents (National ID Card) uploaded on
-- onboarding-step3.html. Safe to run multiple times (idempotent). Run this
-- in the Supabase SQL Editor.
--
-- Lives inside strategic-x/ (not the repo root, unlike the storefront's
-- own schema files) so it travels with this folder if/when Strategic X is
-- extracted into its own project.
--
-- SECURITY NOTE: unlike sx-shop-assets (public bucket for logos/banners),
-- this bucket is deliberately NOT public. A National ID Card image is
-- sensitive personal data (PII) and must never be reachable via a public
-- URL. Only the uploading user can INSERT or SELECT their own file
-- (scoped by the auth.uid() folder prefix); there is no public/anon
-- policy at all. The client stores the storage PATH (not a public URL) in
-- `sx_id_card_path` user_metadata — to actually view/verify the document
-- later, generate a short-lived signed URL server-side (e.g.
-- `supabaseAdmin.storage.from('sx-verification-docs').createSignedUrl(path, ...)`
-- via a service-role Edge Function), do not attempt getPublicUrl() on
-- this bucket.
--
-- What this does:
--   1. Creates a PRIVATE storage bucket "sx-verification-docs".
--   2. Allows authenticated users to INSERT and SELECT only within their
--      own folder path (e.g. "<user-id>/id-card/..."). No public policy,
--      no cross-user access, no update/delete.

insert into storage.buckets (id, name, public)
values ('sx-verification-docs', 'sx-verification-docs', false)
on conflict (id) do update set public = false;

drop policy if exists "Shop owners can upload their own verification docs" on storage.objects;
create policy "Shop owners can upload their own verification docs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sx-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Shop owners can view their own verification docs" on storage.objects;
create policy "Shop owners can view their own verification docs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sx-verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
