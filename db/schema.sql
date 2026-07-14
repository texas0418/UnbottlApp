-- ============================================================================
-- Unbottl — full schema, reconstructed from the app code
-- ============================================================================
-- Purpose: stand up a FRESH Supabase project for Unbottl when the old project
-- can't be restored. Paste into Supabase → SQL Editor and run top to bottom,
-- THEN run db/public-menu-access.sql.
--
-- Structure: ALL TABLES are created first, then ALL RLS policies — so nothing
-- references a table before it exists. Safe to re-run: tables use
-- "if not exists" and every policy is dropped-then-created.
--
-- IMPORTANT — reconstructed from how the app reads/writes these tables, NOT
-- from a DB dump. Core tables (user_profiles, restaurants, locations, wines,
-- beverages, favorites, visits) are high-confidence. Peripheral tables
-- (subscriptions, staff_invitations, user_beverage_log, feedback) are
-- best-effort — marked TODO; adjust once the app exercises them. Test each flow
-- (sign-up, owner CRUD, guest scan) after import.
--
-- REQUIRED run order for a fresh project (run each in the SQL editor):
--   1. db/schema.sql                    (this file — tables + RLS)
--   2. db/fix-user-profiles-trigger.sql (auto-create profiles on signup)
--   3. db/fix-rls-recursion.sql         (breaks restaurants/staff RLS loop)
--   4. db/public-menu-access.sql        (public QR-menu views)
-- Then point the app's EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY (and EAS secrets)
-- at the new project.
-- ============================================================================

-- gen_random_uuid() ships with Supabase (pgcrypto). No extension step needed.

-- ############################################################################
-- SECTION 1 — TABLES (created in foreign-key dependency order)
-- ############################################################################

-- One row per auth user. `user_type` drives consumer vs restaurant routing.
create table if not exists public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  user_type    text not null default 'consumer'
               check (user_type in ('consumer', 'restaurant_owner', 'staff')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.restaurants (
  id                          uuid primary key default gen_random_uuid(),
  owner_id                    uuid not null references auth.users(id) on delete cascade,
  name                        text not null,
  email                       text,
  phone                       text,
  description                 text,
  website                     text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  is_founding_member          boolean not null default false,
  founding_member_number      integer,
  founding_member_expires_at  timestamptz
);

create table if not exists public.locations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  address       text,
  city          text,
  state         text,
  zip_code      text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Restaurant menu catalog: beer / spirit / cocktail / non-alcoholic / wine.
create table if not exists public.beverages (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category      text not null
               check (category in ('wine','beer','spirit','cocktail','non-alcoholic')),
  name          text not null,
  brand         text,
  type          text,
  vintage       integer,
  region        text,
  country       text,
  description   text,
  tasting_notes text,
  price         numeric not null default 0,
  glass_price   numeric,
  cost          numeric,            -- PRIVATE: never exposed in public menu view
  quantity      integer not null default 0,
  abv           numeric,
  image_url     text,
  featured      boolean not null default false,
  in_stock      boolean not null default true,
  is_active     boolean not null default true,
  food_pairings text[] not null default '{}',
  dietary_tags  text[] not null default '{}',
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists beverages_restaurant_id_idx on public.beverages(restaurant_id);

-- LEGACY local-first table, keyed by device_id (not tied to an auth user).
-- TODO: decide whether to fold wines into `beverages` long-term.
create table if not exists public.wines (
  id            uuid primary key default gen_random_uuid(),
  device_id     text,
  name          text not null,
  producer      text,
  type          text,
  vintage       integer,
  region        text,
  country       text,
  grape         text,
  price         numeric not null default 0,
  rating        numeric,
  quantity      integer not null default 0,
  description   text,
  tasting_notes text,
  pairings      text[] not null default '{}',
  image_url     text,
  in_stock      boolean not null default true,
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists wines_device_id_idx on public.wines(device_id);

create table if not exists public.favorite_beverages (
  user_id     uuid not null references auth.users(id) on delete cascade,
  beverage_id uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, beverage_id)
);

create table if not exists public.favorite_restaurants (
  user_id       uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- Powers "recently viewed menus" when signed in.
create table if not exists public.restaurant_visits (
  user_id       uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  visited_at    timestamptz not null default now(),
  visit_count   integer not null default 1,
  primary key (user_id, restaurant_id)
);

create table if not exists public.restaurant_staff (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  role          text not null default 'staff',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- TODO: verify columns against the staff-management flow.
create table if not exists public.staff_invitations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  email         text not null,
  role          text not null default 'staff',
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

-- TODO: verify columns against the pricing/subscription flow.
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  plan          text not null default 'free',
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- TODO: verify columns against the consumer logging flow.
create table if not exists public.user_beverage_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  beverage_name text,
  beverage_id   uuid,
  category      text,
  rating        numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  message    text not null,
  category   text,
  created_at timestamptz not null default now()
);

-- ############################################################################
-- SECTION 2 — ROW LEVEL SECURITY (all tables now exist, so no forward refs)
-- ############################################################################

alter table public.user_profiles     enable row level security;
alter table public.restaurants        enable row level security;
alter table public.locations          enable row level security;
alter table public.beverages          enable row level security;
alter table public.wines              enable row level security;
alter table public.favorite_beverages enable row level security;
alter table public.favorite_restaurants enable row level security;
alter table public.restaurant_visits  enable row level security;
alter table public.restaurant_staff   enable row level security;
alter table public.staff_invitations  enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.user_beverage_log  enable row level security;
alter table public.feedback           enable row level security;

-- ─── user_profiles ───────────────────────────────────────────────────────────
drop policy if exists "Profiles are readable by owner" on public.user_profiles;
create policy "Profiles are readable by owner"
  on public.user_profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users insert their own profile" on public.user_profiles;
create policy "Users insert their own profile"
  on public.user_profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users update their own profile" on public.user_profiles;
create policy "Users update their own profile"
  on public.user_profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ─── restaurants ─────────────────────────────────────────────────────────────
drop policy if exists "Owners manage their restaurants" on public.restaurants;
create policy "Owners manage their restaurants"
  on public.restaurants for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Staff read their restaurants" on public.restaurants;
create policy "Staff read their restaurants"
  on public.restaurants for select to authenticated
  using (exists (select 1 from public.restaurant_staff s
                 where s.restaurant_id = restaurants.id and s.user_id = auth.uid() and s.is_active));

-- ─── locations ───────────────────────────────────────────────────────────────
drop policy if exists "Owners manage their locations" on public.locations;
create policy "Owners manage their locations"
  on public.locations for all to authenticated
  using (exists (select 1 from public.restaurants r
                 where r.id = locations.restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r
                 where r.id = locations.restaurant_id and r.owner_id = auth.uid()));

-- ─── beverages (public/guest read handled by db/public-menu-access.sql view) ──
drop policy if exists "Owners manage their beverages" on public.beverages;
create policy "Owners manage their beverages"
  on public.beverages for all to authenticated
  using (exists (select 1 from public.restaurants r
                 where r.id = beverages.restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r
                 where r.id = beverages.restaurant_id and r.owner_id = auth.uid()));

-- ─── wines (permissive to match current device-scoped, non-auth usage) ───────
drop policy if exists "Wines are readable by anyone" on public.wines;
create policy "Wines are readable by anyone" on public.wines for select using (true);
drop policy if exists "Wines are writable by anyone" on public.wines;
create policy "Wines are writable by anyone" on public.wines for all
  using (true) with check (true);

-- ─── favorite_beverages ──────────────────────────────────────────────────────
drop policy if exists "Users manage their favorite beverages" on public.favorite_beverages;
create policy "Users manage their favorite beverages"
  on public.favorite_beverages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── favorite_restaurants ────────────────────────────────────────────────────
drop policy if exists "Users manage their favorite restaurants" on public.favorite_restaurants;
create policy "Users manage their favorite restaurants"
  on public.favorite_restaurants for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── restaurant_visits ───────────────────────────────────────────────────────
drop policy if exists "Users manage their own visits" on public.restaurant_visits;
create policy "Users manage their own visits"
  on public.restaurant_visits for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── restaurant_staff ────────────────────────────────────────────────────────
drop policy if exists "Staff rows readable by the member or the owner" on public.restaurant_staff;
create policy "Staff rows readable by the member or the owner"
  on public.restaurant_staff for select to authenticated
  using (user_id = auth.uid()
         or exists (select 1 from public.restaurants r
                    where r.id = restaurant_staff.restaurant_id and r.owner_id = auth.uid()));
drop policy if exists "Owners manage staff" on public.restaurant_staff;
create policy "Owners manage staff"
  on public.restaurant_staff for all to authenticated
  using (exists (select 1 from public.restaurants r
                 where r.id = restaurant_staff.restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r
                 where r.id = restaurant_staff.restaurant_id and r.owner_id = auth.uid()));

-- ─── staff_invitations ───────────────────────────────────────────────────────
drop policy if exists "Owners manage invitations" on public.staff_invitations;
create policy "Owners manage invitations"
  on public.staff_invitations for all to authenticated
  using (exists (select 1 from public.restaurants r
                 where r.id = staff_invitations.restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r
                 where r.id = staff_invitations.restaurant_id and r.owner_id = auth.uid()));

-- ─── subscriptions ───────────────────────────────────────────────────────────
drop policy if exists "Users read their own subscription" on public.subscriptions;
create policy "Users read their own subscription"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id
         or exists (select 1 from public.restaurants r
                    where r.id = subscriptions.restaurant_id and r.owner_id = auth.uid()));

-- ─── user_beverage_log ───────────────────────────────────────────────────────
drop policy if exists "Users manage their own log" on public.user_beverage_log;
create policy "Users manage their own log"
  on public.user_beverage_log for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── feedback ────────────────────────────────────────────────────────────────
drop policy if exists "Anyone signed in can submit feedback" on public.feedback;
create policy "Anyone signed in can submit feedback"
  on public.feedback for insert to authenticated with check (true);
drop policy if exists "Users read their own feedback" on public.feedback;
create policy "Users read their own feedback"
  on public.feedback for select to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- Next: run db/public-menu-access.sql to add the public QR-menu views.
-- ============================================================================
