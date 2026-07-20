-- ============================================================================
-- Stored functions the app calls via supabase.rpc()
-- ============================================================================
-- These existed in the old project but weren't in the reconstruction, so the
-- app hit "Could not find the function ... in the schema cache" (PGRST202).
-- Reconstructed from the call sites:
--   create_restaurant_with_owner  app/restaurant-setup.tsx
--   delete_user_account           contexts/AuthContext.tsx
--   accept_staff_invitation       hooks/useStaff.ts
-- Safe to re-run.
-- ============================================================================

-- ── create_restaurant_with_owner(p_name, p_email, p_phone) -> new restaurant id
-- The app uses the returned uuid directly as restaurant_id.
create or replace function public.create_restaurant_with_owner(
  p_name  text,
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.restaurants (owner_id, name, email, phone)
  values (v_uid, p_name, p_email, p_phone)
  returning id into v_id;

  -- Creating a restaurant makes this account an owner.
  update public.user_profiles
     set user_type = 'restaurant_owner', updated_at = now()
   where id = v_uid and user_type <> 'restaurant_owner';

  return v_id;
end;
$$;

-- ── delete_user_account() -> void  (deletes the current user + cascades)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  -- ON DELETE CASCADE on the auth.users FKs removes the profile, restaurants,
  -- beverages, favorites, visits, etc. along with the user.
  delete from auth.users where id = v_uid;
end;
$$;

-- ── accept_staff_invitation(invitation_token) -> json {success, error, restaurant_id}
-- TODO(best-effort): reconstructed from the call site. Verify against the real
-- staff-invite flow (token generation, expiry) once that feature is exercised.
alter table public.staff_invitations add column if not exists token text;
alter table public.staff_invitations add column if not exists accepted_at timestamptz;

create or replace function public.accept_staff_invitation(invitation_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.staff_invitations;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_inv
    from public.staff_invitations
   where token = invitation_token and status = 'pending'
   limit 1;

  if v_inv.id is null then
    return json_build_object('success', false, 'error', 'Invitation not found or already used');
  end if;

  if not exists (
    select 1 from public.restaurant_staff
     where restaurant_id = v_inv.restaurant_id and user_id = v_uid
  ) then
    insert into public.restaurant_staff (restaurant_id, user_id, role, is_active)
    values (v_inv.restaurant_id, v_uid, coalesce(v_inv.role, 'staff'), true);
  end if;

  update public.staff_invitations
     set status = 'accepted', accepted_at = now()
   where id = v_inv.id;

  return json_build_object('success', true, 'restaurant_id', v_inv.restaurant_id);
end;
$$;

-- Make sure PostgREST picks up the new functions immediately.
notify pgrst, 'reload schema';
