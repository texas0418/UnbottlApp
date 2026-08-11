-- ============================================================================
-- Storage for venue logos, cover images and drink photos
-- ============================================================================
-- The guest menu could already display a logo, a cover image and a photo per
-- drink. A venue had no way to supply any of them: there was no bucket, and no
-- `storage.from(...)` call anywhere in the app. Issue #25.
--
-- HOW TO APPLY: paste into the Supabase SQL editor (Dashboard → SQL) and run.
-- Safe to re-run.
--
-- PATH CONVENTION — the security depends on it:
--   <restaurant_id>/logo.<ext>
--   <restaurant_id>/cover.<ext>
--   <restaurant_id>/beverages/<beverage_id>.<ext>
-- The first path segment is the owning restaurant. Every write policy checks
-- it, so a venue can only write beneath its own id.
--
-- WHY PUBLIC READ: the guest menu is anonymous — someone scans a QR code with
-- no account and no session. The images have to be fetchable without auth.
-- Nothing sensitive lives here; it is the pictures a venue chose to publish.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-media',
  'venue-media',
  true,
  5242880, -- 5MB. A phone photo resized client-side lands far under this.
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Ownership check for a storage path ──────────────────────────────────────
-- In its own function so a malformed path is a denied write rather than a
-- 22P02 invalid-uuid error surfaced to whoever is uploading. Anything that is
-- not a uuid-shaped first segment simply returns false.
create or replace function public.owns_media_path(object_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public, storage
as $$
declare
  first_segment uuid;
begin
  first_segment := (storage.foldername(object_name))[1]::uuid;
  return public.is_restaurant_owner(first_segment);
exception when others then
  return false;
end;
$$;

-- Internal helper, same treatment as the other RLS helpers: off the public API,
-- but `authenticated` must keep EXECUTE or every storage policy that calls it
-- raises 42501 and uploads stop working. See db/revoke-internal-function-execute.sql.
revoke execute on function public.owns_media_path(text) from public;
revoke execute on function public.owns_media_path(text) from anon;
grant  execute on function public.owns_media_path(text) to authenticated, service_role;

-- ── Policies ────────────────────────────────────────────────────────────────
drop policy if exists "Venue media is publicly readable" on storage.objects;
create policy "Venue media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'venue-media');

drop policy if exists "Owners upload their own venue media" on storage.objects;
create policy "Owners upload their own venue media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'venue-media' and public.owns_media_path(name));

drop policy if exists "Owners replace their own venue media" on storage.objects;
create policy "Owners replace their own venue media"
  on storage.objects for update to authenticated
  using (bucket_id = 'venue-media' and public.owns_media_path(name))
  with check (bucket_id = 'venue-media' and public.owns_media_path(name));

drop policy if exists "Owners delete their own venue media" on storage.objects;
create policy "Owners delete their own venue media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'venue-media' and public.owns_media_path(name));

-- ============================================================================
-- Verify
-- ============================================================================
-- Expect no exception. Proves an owner may write under their own venue, another
-- account may not write under it, and malformed paths deny instead of erroring.
--
--   do $$
--   declare owner_id uuid; other_id uuid;
--           delbar uuid := '<a restaurant id>';
--   begin
--     select r.owner_id into owner_id from public.restaurants r where r.id = delbar;
--     select u.id into other_id from auth.users u where u.id <> owner_id limit 1;
--     set local role authenticated;
--     perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
--     if not public.owns_media_path(delbar || '/logo.png') then
--       raise exception 'owner denied'; end if;
--     perform set_config('request.jwt.claims', json_build_object('sub', other_id)::text, true);
--     if public.owns_media_path(delbar || '/logo.png') then
--       raise exception 'other user allowed'; end if;
--     if public.owns_media_path('../../etc/passwd') then
--       raise exception 'traversal allowed'; end if;
--     reset role;
--   end $$;
-- ============================================================================
