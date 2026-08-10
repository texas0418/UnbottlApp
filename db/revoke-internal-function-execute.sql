-- ============================================================================
-- Take internal SECURITY DEFINER functions off the public REST surface
-- ============================================================================
-- Supabase's security linter flagged six SECURITY DEFINER functions as callable
-- by the `anon` role over `/rest/v1/rpc/...`. Three of them are meant to be:
-- create_restaurant_with_owner, delete_user_account and accept_staff_invitation
-- are app entry points, and each already rejects an unauthenticated caller by
-- checking auth.uid() first.
--
-- The other three were never meant to be reachable at all:
--   is_restaurant_owner(uuid)  internal RLS helper
--   is_active_staff(uuid)      internal RLS helper
--   handle_new_user()          trigger function for on_auth_user_created
--
-- HOW TO APPLY: paste into the Supabase SQL editor (Dashboard → SQL) and run.
-- Safe to re-run.
--
-- TWO THINGS THAT MAKE THIS EASY TO GET WRONG:
--
--   1. Postgres grants EXECUTE to PUBLIC by default. Revoking from `anon` alone
--      leaves the function reachable through the PUBLIC grant. Both have to go.
--
--   2. `authenticated` MUST KEEP EXECUTE on the two RLS helpers. A policy's
--      USING expression is evaluated as the querying role, so revoking it does
--      not merely hide the function — it makes every owner-scoped policy raise
--      42501 (permission denied) and locks owners out of their own restaurants,
--      locations, beverages, staff and invitations.
-- ============================================================================

-- ── RLS helpers: drop PUBLIC and anon, keep authenticated ───────────────────
revoke execute on function public.is_restaurant_owner(uuid) from public;
revoke execute on function public.is_restaurant_owner(uuid) from anon;
grant  execute on function public.is_restaurant_owner(uuid) to authenticated, service_role;

revoke execute on function public.is_active_staff(uuid) from public;
revoke execute on function public.is_active_staff(uuid) from anon;
grant  execute on function public.is_active_staff(uuid) to authenticated, service_role;

-- ── Trigger function: nobody calls this over REST ───────────────────────────
-- Granted explicitly to supabase_auth_admin, which was reaching it through the
-- PUBLIC grant being revoked here. Without this the on_auth_user_created
-- trigger would be relying on Postgres not re-checking EXECUTE at firing time,
-- which is true today but is not a thing to bet signup on.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
grant  execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- ============================================================================
-- Verify
-- ============================================================================
-- Expect anon=false for all three, authenticated=true for the two helpers and
-- false for handle_new_user:
--
--   select p.proname,
--          has_function_privilege('anon',          p.oid, 'execute') as anon,
--          has_function_privilege('authenticated', p.oid, 'execute') as authenticated
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('is_restaurant_owner','is_active_staff','handle_new_user');
--
-- Expect 404 PGRST202 (function not exposed to this role):
--
--   curl -X POST "$URL/rest/v1/rpc/is_restaurant_owner" -H "apikey: $ANON_KEY" \
--        -H "Content-Type: application/json" -d '{}'
--
-- Expect no error — proves the policies can still call the helpers:
--
--   do $$ declare c int; begin
--     set local role authenticated;
--     select count(*) into c from public.restaurants;
--     select count(*) into c from public.beverages;
--     reset role;
--   end $$;
--
-- NOTE: the linter will still report `security_definer_view` on
-- public_menu_restaurants and public_menu_beverages. That is intentional and
-- documented in db/public-menu-access.sql — it is the mechanism that lets a
-- guest read curated columns while the base tables stay closed.
-- ============================================================================
