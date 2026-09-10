-- Adds storage support for Strategic X shop profile images (logo + banner)
-- uploaded on onboarding-step3.html. Safe to run multiple times
-- (idempotent). Run this in the Supabase SQL Editor.
--
-- Lives inside strategic-x/ (not the repo root, unlike the storefront's
-- own schema files) so it travels with this folder if/when Strategic X is
-- extracted into its own project.
--
-- What this does:
--   1. Creates a public storage bucket "sx-shop-assets" for shop logo/banner
--      uploads (namespaced with the `sx-` prefix so it can be split off
--      cleanly if/when the Strategic X portal is extracted into its own
--      project, per the existing strategic-x isolation convention).
--   2. Allows only authenticated users to upload (INSERT), and only into a
--      folder path prefixed with their own auth.uid() (e.g.
--      "<user-id>/logo/...", "<user-id>/banner/..."), so one shop owner
--      cannot write into another owner's folder. Public read access is
--      granted so shop logos/banners can be displayed on public pages.
--      Update/delete are intentionally NOT granted.
--
-- Note: these uploads are optional in the onboarding UI — this bucket only
-- needs to exist for the upload calls to succeed; missing images never
-- block onboarding completion either way.

-- file_size_limit/allowed_mime_types are enforced by Supabase Storage
-- server-side, so even a client that bypasses the <input accept=...> UI
-- hint (e.g. a direct API call) can't upload oversized files or
-- non-image content (such as an SVG with an embedded <script>, which the
-- browser can execute if the file is opened directly from this public
-- bucket's URL).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sx-shop-assets', 'sx-shop-assets', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "Shop owners can upload their own shop assets" on storage.objects;
create policy "Shop owners can upload their own shop assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sx-shop-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public can view shop assets" on storage.objects;
create policy "Public can view shop assets"
on storage.objects
for select
to public
using (bucket_id = 'sx-shop-assets');
