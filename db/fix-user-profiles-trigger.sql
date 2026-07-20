-- ============================================================================
-- Fix: auto-create user_profiles on signup + backfill existing accounts
-- ============================================================================
-- The app's signUp() stores display_name + user_type in AUTH metadata, but
-- relies on a database trigger to copy that into public.user_profiles. The
-- initial schema had the table but not the trigger — so no profile row is ever
-- created, every account resolves to the default user_type='consumer', and
-- restaurant accounts wrongly land in the consumer experience (and get bounced
-- out of restaurant-only screens).
--
-- This adds the trigger, backfills any accounts created before it existed, and
-- adds the age-verification column the app reads. Safe to re-run.
-- ============================================================================

-- 1. Column the app reads (profile.is_age_verified) that the first schema missed.
alter table public.user_profiles
  add column if not exists is_age_verified boolean not null default false;

-- 2. Trigger function: copy signup metadata into user_profiles.
--    security definer so it can insert regardless of the caller's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'user_type', 'consumer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Fire it after every new auth user is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill: create a profile for every existing user that lacks one,
--    reading user_type from the metadata their signup already stored.
insert into public.user_profiles (id, email, display_name, user_type)
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data->>'display_name', ''),
       coalesce(u.raw_user_meta_data->>'user_type', 'consumer')
from auth.users u
left join public.user_profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- If a restaurant account STILL shows as consumer after re-login (e.g. it was
-- created without the restaurant option), promote it explicitly — replace the
-- email and uncomment:
--
-- update public.user_profiles
--    set user_type = 'restaurant_owner'
--  where email = 'you@example.com';
-- ----------------------------------------------------------------------------
