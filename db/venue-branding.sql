-- ============================================================================
-- Venue branding on the guest menu
-- ============================================================================
-- A guest who scans a venue's QR code should see THAT VENUE's menu, not a
-- generically Unbottl-branded page. Today the public view exposes only
-- `id` and `name`, so the guest menu has no branding to work with at all.
--
-- This migration adds the branding columns to `restaurants` and widens the
-- public view to expose them.
--
-- HOW TO APPLY: paste into the Supabase SQL editor (Dashboard → SQL) and run,
-- or `supabase db execute`. Safe to re-run — every statement is idempotent.
--
-- SAFETY NOTES:
--   * Only display fields are exposed. Owner contact (email/phone), billing and
--     `cost` stay private, exactly as before.
--   * brand_color is validated as a 6-digit hex so a bad value can't break the
--     guest menu's styling.
-- ============================================================================

-- 1. Branding columns on restaurants -----------------------------------------
alter table public.restaurants
  add column if not exists logo_url         text,
  add column if not exists cover_image_url  text,
  add column if not exists brand_color      text,
  add column if not exists cuisine_type     text;

-- Reject anything that isn't a #RRGGBB hex colour. Null means "use the
-- Unbottl default", which is what every existing row will be.
alter table public.restaurants
  drop constraint if exists restaurants_brand_color_hex;

alter table public.restaurants
  add constraint restaurants_brand_color_hex
  check (brand_color is null or brand_color ~* '^#[0-9a-f]{6}$');

-- 2. Widen the public menu view to carry the branding ------------------------
-- Unchanged intent from db/public-menu-access.sql: curated, read-only, display
-- fields only. `description` and `city` are NOT added here — the TypeScript
-- PublicRestaurant type declares them but nothing renders them, so exposing
-- them would widen the public surface for no benefit.
create or replace view public.public_menu_restaurants
with (security_invoker = off) as
  select
    id,
    name,
    logo_url,
    cover_image_url,
    brand_color,
    cuisine_type
  from public.restaurants;

-- 3. Re-grant (create or replace view drops grants on some Postgres versions) -
grant select on public.public_menu_restaurants to anon, authenticated;

-- ============================================================================
-- 4. Verify
-- ============================================================================
-- Expect six columns back, and no error:
--
--   select id, name, logo_url, cover_image_url, brand_color, cuisine_type
--   from public.public_menu_restaurants limit 1;
--
-- Expect a constraint violation (this is the check working):
--
--   update public.restaurants set brand_color = 'not-a-colour'
--   where id = (select id from public.restaurants limit 1);
-- ============================================================================
