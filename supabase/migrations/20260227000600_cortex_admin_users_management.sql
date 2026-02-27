-- Admin users management (soft delete + role management + provider metadata) on schema cortex

create schema if not exists cortex;

alter table cortex.profiles
  add column if not exists email text,
  add column if not exists auth_provider text not null default 'email',
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

update cortex.profiles p
set
  email = coalesce(nullif(trim(p.email), ''), u.email),
  auth_provider = coalesce(
    nullif(trim(p.auth_provider), ''),
    nullif(lower(trim(u.raw_app_meta_data->>'provider')), ''),
    'email'
  )
from auth.users u
where u.id = p.user_id;

update cortex.profiles
set auth_provider = 'email'
where auth_provider is null or trim(auth_provider) = '';

create or replace function cortex.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = cortex, public
as $$
begin
  insert into cortex.profiles (user_id, full_name, role, avatar_url, email, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user',
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
      nullif(trim(new.raw_user_meta_data->>'picture'), '')
    ),
    new.email,
    coalesce(
      nullif(lower(trim(new.raw_app_meta_data->>'provider')), ''),
      'email'
    )
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;

drop policy if exists "Admins can view all profiles" on cortex.profiles;
create policy "Admins can view all profiles"
on cortex.profiles
for select
using (cortex.is_admin_user());

drop policy if exists "Admins can update all profiles" on cortex.profiles;
create policy "Admins can update all profiles"
on cortex.profiles
for update
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

create index if not exists idx_cortex_profiles_role
  on cortex.profiles(role);

create index if not exists idx_cortex_profiles_auth_provider
  on cortex.profiles(auth_provider);

create index if not exists idx_cortex_profiles_is_deleted
  on cortex.profiles(is_deleted);
