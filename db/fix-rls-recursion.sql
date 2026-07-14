-- ============================================================================
-- Fix: infinite recursion (42P17) in restaurants / restaurant_staff policies
-- ============================================================================
-- The "Staff read their restaurants" policy on `restaurants` subqueried
-- `restaurant_staff`, whose policies subqueried `restaurants` — so evaluating
-- either table's RLS recursed forever ("infinite recursion detected in policy
-- for relation restaurants").
--
-- Fix: move the ownership / staff-membership checks into SECURITY DEFINER
-- functions. Because they run as the definer, the queries inside them bypass
-- RLS, so no policy re-evaluates and the loop is broken. All owner-scoped
-- policies are rewritten to use them. Safe to re-run.
-- ============================================================================

-- ── Helper functions (bypass RLS internally) ────────────────────────────────
create or replace function public.is_restaurant_owner(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants
    where id = rid and owner_id = auth.uid()
  );
$$;

create or replace function public.is_active_staff(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.restaurant_staff
    where restaurant_id = rid and user_id = auth.uid() and is_active
  );
$$;

-- ── restaurants ─────────────────────────────────────────────────────────────
drop policy if exists "Staff read their restaurants" on public.restaurants;
create policy "Staff read their restaurants"
  on public.restaurants for select to authenticated
  using (public.is_active_staff(id));

-- ── restaurant_staff ────────────────────────────────────────────────────────
drop policy if exists "Staff rows readable by the member or the owner" on public.restaurant_staff;
create policy "Staff rows readable by the member or the owner"
  on public.restaurant_staff for select to authenticated
  using (user_id = auth.uid() or public.is_restaurant_owner(restaurant_id));

drop policy if exists "Owners manage staff" on public.restaurant_staff;
create policy "Owners manage staff"
  on public.restaurant_staff for all to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

-- ── locations ───────────────────────────────────────────────────────────────
drop policy if exists "Owners manage their locations" on public.locations;
create policy "Owners manage their locations"
  on public.locations for all to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

-- ── beverages ───────────────────────────────────────────────────────────────
drop policy if exists "Owners manage their beverages" on public.beverages;
create policy "Owners manage their beverages"
  on public.beverages for all to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

-- ── staff_invitations ───────────────────────────────────────────────────────
drop policy if exists "Owners manage invitations" on public.staff_invitations;
create policy "Owners manage invitations"
  on public.staff_invitations for all to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

-- ── subscriptions ───────────────────────────────────────────────────────────
drop policy if exists "Users read their own subscription" on public.subscriptions;
create policy "Users read their own subscription"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id or public.is_restaurant_owner(restaurant_id));
