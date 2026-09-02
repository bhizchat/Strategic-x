-- Lets a signed-in Strategic X user permanently delete their own account
-- from the "Delete Account" item in the profile dropdown (dashboard.html,
-- my-shop.html, products.html, reviews.html, add-product.html,
-- payments-billing.html).
--
-- There is no server/Edge Function in this project, and the browser only
-- ever holds the anon/authenticated key, so calling Supabase Auth's admin
-- deleteUser() API (which needs the service_role key) isn't an option here.
-- Instead this defines a SECURITY DEFINER function that deletes the
-- caller's own row from auth.users directly. Deleting that row cascades
-- automatically to:
--   - sx_shops (owner_id references auth.users on delete cascade)
--   - sx_products (owner_id references auth.users on delete cascade,
--     and shop_id references sx_shops on delete cascade)
--   - sx_shop_members (user_id references auth.users on delete cascade,
--     covering both "this user owns a shop" rows they joined as staff on,
--     and their own membership row if they were staff/manager themselves)
-- so no manual cleanup of those tables is needed here.
--
-- KNOWN LIMITATION: this does not delete uploaded Storage files (logo,
-- banner, ID card, product images) — only their database rows/paths go
-- away with the cascades above. Cleaning up Storage objects would need a
-- service-role call (Edge Function) and is out of scope for now.
--
-- Must be run in the Supabase SQL Editor: the editor's connection role
-- (postgres) has the necessary privileges to delete from auth.users,
-- which a function owned by a lower-privileged role would not.
--
-- Safe to run multiple times (idempotent).

create or replace function public.sx_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.sx_delete_account() from public;
grant execute on function public.sx_delete_account() to authenticated;
