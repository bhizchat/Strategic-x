-- Creates the staff/manager team feature for Strategic X shops:
--   1. Adds an `invite_code` column to sx_shops (one shareable code per
--      shop, regenerable by the owner) used by staff to join.
--   2. Creates "sx_shop_members": one row per person who has joined a
--      shop's team via that invite code. `role` starts NULL ("Pending" in
--      the UI) — a new member has ZERO permissions anywhere else in the
--      app until the shop owner explicitly assigns a role
--      ('manager' | 'staff' | 'viewer') from the My Shop > Team Members
--      screen. This intentionally decouples "has joined the shop" from
--      "can actually do anything", so a leaked/guessed invite code alone
--      can never grant real access.
--   3. Adds a SECURITY DEFINER function `sx_join_shop_by_code` — the ONLY
--      way a row is ever inserted into sx_shop_members. It looks up the
--      shop by invite code (which staff have no direct read access to)
--      and creates/updates the caller's own membership row. There is
--      deliberately no client-facing INSERT policy on sx_shop_members —
--      direct inserts from the browser are always denied.
--
-- Lives inside strategic-x/ (not the repo root) so it travels with this
-- folder if/when Strategic X is extracted into its own project.
--
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL
-- Editor after sx-shops-schema.sql.

-- ---------------------------------------------------------------------
-- 1. Invite code column on sx_shops
-- ---------------------------------------------------------------------

alter table public.sx_shops add column if not exists invite_code text;

-- Partial unique index (rather than a plain UNIQUE constraint) so many
-- shops can share invite_code = NULL (haven't generated one yet) without
-- violating uniqueness — only non-null codes must be unique.
create unique index if not exists sx_shops_invite_code_key
  on public.sx_shops (invite_code)
  where invite_code is not null;

-- ---------------------------------------------------------------------
-- 2. sx_shop_members
-- ---------------------------------------------------------------------

create table if not exists public.sx_shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.sx_shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  role text check (role in ('manager', 'staff', 'viewer')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists sx_shop_members_shop_id_idx on public.sx_shop_members (shop_id);
create index if not exists sx_shop_members_user_id_idx on public.sx_shop_members (user_id);

alter table public.sx_shop_members enable row level security;

-- SECURITY DEFINER helper functions used inside the RLS policies below.
-- Without these, a policy on sx_shops that queries sx_shop_members, next
-- to a policy on sx_shop_members that queries sx_shops back, causes
-- Postgres to re-evaluate each table's RLS while evaluating the other's —
-- "infinite recursion detected in policy for relation sx_shops". Wrapping
-- each lookup in a SECURITY DEFINER function makes it run with the
-- function owner's privileges (bypassing RLS for that lookup only),
-- breaking the cycle while keeping the same access rules.
create or replace function public.sx_is_shop_owner(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sx_shops s
    where s.id = p_shop_id
    and s.owner_id = auth.uid()
  );
$$;

create or replace function public.sx_is_shop_member(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sx_shop_members m
    where m.shop_id = p_shop_id
    and m.user_id = auth.uid()
  );
$$;

revoke all on function public.sx_is_shop_owner(uuid) from public;
revoke all on function public.sx_is_shop_member(uuid) from public;
grant execute on function public.sx_is_shop_owner(uuid) to authenticated;
grant execute on function public.sx_is_shop_member(uuid) to authenticated;

-- Owner can see every member of their own shop.
drop policy if exists "Owners can view their shop members" on public.sx_shop_members;
create policy "Owners can view their shop members"
on public.sx_shop_members
for select
to authenticated
using (public.sx_is_shop_owner(shop_id));

-- A member can see their own membership row (needed for the "waiting for
-- role" status screen).
drop policy if exists "Members can view their own membership" on public.sx_shop_members;
create policy "Members can view their own membership"
on public.sx_shop_members
for select
to authenticated
using (user_id = auth.uid());

-- Owner assigns/changes a member's role (Manager / Staff / Viewer).
drop policy if exists "Owners can update member roles" on public.sx_shop_members;
create policy "Owners can update member roles"
on public.sx_shop_members
for update
to authenticated
using (public.sx_is_shop_owner(shop_id))
with check (public.sx_is_shop_owner(shop_id));

-- Owner can remove a member from their shop's team.
drop policy if exists "Owners can remove members" on public.sx_shop_members;
create policy "Owners can remove members"
on public.sx_shop_members
for delete
to authenticated
using (public.sx_is_shop_owner(shop_id));

-- Deliberately NO insert policy here: the only way a row is created is
-- through sx_join_shop_by_code() below, which runs as SECURITY DEFINER
-- and so bypasses RLS for its own insert. A direct client-side insert
-- attempt against this table will always be denied.

-- Lets a staff/manager who has joined a shop read that shop's own row —
-- e.g. to show the shop name/logo on their "waiting for role" screen.
-- Added here (after sx_shop_members exists) since it references that
-- table. Additive: does not replace the existing owner-only SELECT
-- policy on sx_shops — Postgres OR's permissive policies together.
drop policy if exists "Members can view their assigned shop" on public.sx_shops;
create policy "Members can view their assigned shop"
on public.sx_shops
for select
to authenticated
using (public.sx_is_shop_member(id));

-- ---------------------------------------------------------------------
-- 3. Join-by-code function
-- ---------------------------------------------------------------------

-- Dropped first because CREATE OR REPLACE FUNCTION cannot change a
-- function's return type, and renaming a RETURNS TABLE column (done below
-- to fix the "column reference is ambiguous" bug) counts as a return-type
-- change. Safe to drop: the frontend only calls this by name via rpc(),
-- and no other object depends on it.
drop function if exists public.sx_join_shop_by_code(text, text);

create or replace function public.sx_join_shop_by_code(p_invite_code text, p_full_name text)
returns table (joined_shop_id uuid, shop_name text, logo_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_shop_name text;
  v_logo_url text;
begin
  if p_invite_code is null or btrim(p_invite_code) = '' then
    raise exception 'Please enter an invitation code.';
  end if;
  if p_full_name is null or btrim(p_full_name) = '' then
    raise exception 'Please enter your full name.';
  end if;

  select s.id, s.shop_name, s.logo_url
  into v_shop_id, v_shop_name, v_logo_url
  from public.sx_shops s
  where s.invite_code is not null
    and upper(s.invite_code) = upper(btrim(p_invite_code))
  limit 1;

  if v_shop_id is null then
    raise exception 'Invalid invitation code. Please check and try again.';
  end if;

  insert into public.sx_shop_members (shop_id, user_id, full_name, role)
  values (v_shop_id, auth.uid(), btrim(p_full_name), null)
  on conflict (shop_id, user_id)
  do update set full_name = excluded.full_name, updated_at = now();

  return query select v_shop_id, v_shop_name, v_logo_url;
end;
$$;

revoke all on function public.sx_join_shop_by_code(text, text) from public;
grant execute on function public.sx_join_shop_by_code(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Let joined staff/managers view their shop's products
-- ---------------------------------------------------------------------

-- The staff/manager dashboard is the SAME dashboard.html as the owner
-- uses (not a separate page) — it shows the real shop's product count,
-- rating, and click analytics. sx_products' existing SELECT policy only
-- allows owner_id = auth.uid(), which would leave every stat at 0 for a
-- staff account. This policy is additive (Postgres OR's permissive
-- policies together) and read-only — it does not change who can
-- insert/update/delete products, only who can view them.
drop policy if exists "Shop members can view their shop's products" on public.sx_products;
create policy "Shop members can view their shop's products"
on public.sx_products
for select
to authenticated
using (shop_id is not null and public.sx_is_shop_member(shop_id));

-- ---------------------------------------------------------------------
-- 5. Managers can manage the team too; drop "viewer" as a role
-- ---------------------------------------------------------------------

-- "Viewer" is being removed as an assignable role — only Manager and
-- Staff remain. Existing rows (if any) must already be manager/staff/
-- null before this runs, or the ALTER TABLE below will fail.
alter table public.sx_shop_members drop constraint if exists sx_shop_members_role_check;
alter table public.sx_shop_members add constraint sx_shop_members_role_check
  check (role in ('manager', 'staff'));

-- A manager (not just the owner) can also see and change other members'
-- roles from the Team Members screen — staff/pending members still
-- cannot. Mirrors sx_is_shop_owner/sx_is_shop_member above.
create or replace function public.sx_is_shop_manager(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sx_shop_members m
    where m.shop_id = p_shop_id
    and m.user_id = auth.uid()
    and m.role = 'manager'
  );
$$;

revoke all on function public.sx_is_shop_manager(uuid) from public;
grant execute on function public.sx_is_shop_manager(uuid) to authenticated;

drop policy if exists "Owners can view their shop members" on public.sx_shop_members;
drop policy if exists "Owners and managers can view their shop members" on public.sx_shop_members;
create policy "Owners and managers can view their shop members"
on public.sx_shop_members
for select
to authenticated
using (public.sx_is_shop_owner(shop_id) or public.sx_is_shop_manager(shop_id));

drop policy if exists "Owners can update member roles" on public.sx_shop_members;
drop policy if exists "Owners and managers can update member roles" on public.sx_shop_members;
create policy "Owners and managers can update member roles"
on public.sx_shop_members
for update
to authenticated
using (public.sx_is_shop_owner(shop_id) or public.sx_is_shop_manager(shop_id))
with check (public.sx_is_shop_owner(shop_id) or public.sx_is_shop_manager(shop_id));

-- Removing a team member stays Owner-only for now (not requested to
-- change) — "Owners can remove members" from section 2 above is untouched.

-- ---------------------------------------------------------------------
-- 6. Let ANY joined team member (any role, even Pending) generate a
--    fresh invite code — inviting more people is low-risk (it grants no
--    permissions by itself), unlike role changes above. sx_shops' own
--    UPDATE policy is still owner-only, so this SECURITY DEFINER
--    function is the only way a non-owner can regenerate the code —
--    it deliberately only ever touches invite_code, never any other
--    shop column, regardless of what a client sends.
-- ---------------------------------------------------------------------

create or replace function public.sx_generate_shop_invite_code(p_shop_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_attempt int := 0;
begin
  v_allowed := public.sx_is_shop_owner(p_shop_id) or public.sx_is_shop_member(p_shop_id);
  if not v_allowed then
    raise exception 'Not authorized to generate an invite code for this shop';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'SX-';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;

    begin
      update public.sx_shops set invite_code = v_code, updated_at = now() where id = p_shop_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 10 then
        raise exception 'Could not generate a unique invite code, please try again';
      end if;
    end;
  end loop;

  return v_code;
end;
$$;

revoke all on function public.sx_generate_shop_invite_code(uuid) from public;
grant execute on function public.sx_generate_shop_invite_code(uuid) to authenticated;

