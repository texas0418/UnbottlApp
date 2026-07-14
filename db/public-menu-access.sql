-- ============================================================================
-- Public menu access for QR scanning
-- ============================================================================
-- Lets an anonymous guest who scans a restaurant's Unbottl QR code
-- (https://unbottl.app/m/<restaurant.id>) read that restaurant's live drink
-- menu — WITHOUT exposing private data.
--
-- Design: instead of opening the base `restaurants` / `beverages` tables to the
-- `anon` role (which would leak owner contact info and the `cost`/margin
-- column), we expose two curated, read-only VIEWS that select only
-- menu-appropriate columns of ACTIVE items. The views run as SECURITY DEFINER
-- (security_invoker = off) so they can read the base tables on the guest's
-- behalf while the base tables stay locked down.
--
-- HOW TO APPLY: paste into the Supabase SQL editor (Dashboard → SQL) and run,
-- or `supabase db execute`. Review the column list against your real schema
-- first — adjust if a column name differs or doesn't exist.
--
-- SAFETY NOTES:
--   * Excludes `cost` (what the restaurant paid) from the beverages view.
--   * Exposes only `id` + `name` from restaurants. Add cuisine/logo/cover
--     columns to the view + services/publicMenu.ts mapping if/when they exist.
--   * The Supabase security linter will flag these as "security definer view";
--     that is intentional and expected for curated public exposure.
-- ============================================================================

-- 1. Restaurants — public display fields only ---------------------------------
create or replace view public.public_menu_restaurants
with (security_invoker = off) as
  select
    id,
    name
  from public.restaurants;

-- 2. Beverages — menu-appropriate columns, ACTIVE items only, NO `cost` --------
create or replace view public.public_menu_beverages
with (security_invoker = off) as
  select
    id,
    restaurant_id,
    category,
    name,
    brand,
    type,
    vintage,
    region,
    country,
    description,
    tasting_notes,
    price,
    glass_price,
    quantity,
    abv,
    image_url,
    featured,
    in_stock,
    is_active,
    food_pairings,
    dietary_tags,
    metadata,
    created_at,
    updated_at
  from public.beverages
  where is_active = true;

-- 3. Grant read access to guests (anon) and signed-in users (authenticated) ---
grant select on public.public_menu_restaurants to anon, authenticated;
grant select on public.public_menu_beverages   to anon, authenticated;

-- ============================================================================
-- 4. restaurant_visits — let signed-in users log the menus they view
-- ============================================================================
-- RecentMenusContext best-effort upserts one row per (user_id, restaurant_id).
-- The upsert needs (a) the table to exist with those columns, and (b) a unique
-- constraint on (user_id, restaurant_id) for ON CONFLICT to target.
--
-- Uncomment/adjust to match your schema. Guests still get local recent-menu
-- history via AsyncStorage even without this.

-- create table if not exists public.restaurant_visits (
--   user_id       uuid not null references auth.users(id) on delete cascade,
--   restaurant_id uuid not null references public.restaurants(id) on delete cascade,
--   visited_at    timestamptz not null default now(),
--   visit_count   integer not null default 1,
--   primary key (user_id, restaurant_id)
-- );

-- alter table public.restaurant_visits enable row level security;

-- create policy "Users read their own visits"
--   on public.restaurant_visits for select
--   to authenticated using (auth.uid() = user_id);

-- create policy "Users write their own visits"
--   on public.restaurant_visits for insert
--   to authenticated with check (auth.uid() = user_id);

-- create policy "Users update their own visits"
--   on public.restaurant_visits for update
--   to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
