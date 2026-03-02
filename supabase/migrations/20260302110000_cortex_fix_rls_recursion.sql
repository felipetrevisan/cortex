-- Corrige recursao de RLS em cortex.diagnostic_niches / cortex.user_niche_access
-- causada por funcoes helper executadas como invoker.

create schema if not exists cortex;

create or replace function cortex.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = cortex, public
as $$
  select exists (
    select 1
    from cortex.profiles p
    where p.user_id = auth.uid()
      and lower(trim(p.role)) = 'admin'
  );
$$;

create or replace function cortex.user_has_niche_access(target_niche_id uuid)
returns boolean
language sql
stable
security definer
set search_path = cortex, public
as $$
  select exists (
    select 1
    from cortex.user_niche_access una
    where una.user_id = auth.uid()
      and una.niche_id = target_niche_id
      and una.status = 'active'
      and (una.expires_at is null or una.expires_at >= now())
  );
$$;

revoke all on function cortex.is_admin_user() from public;
grant execute on function cortex.is_admin_user() to authenticated;

revoke all on function cortex.user_has_niche_access(uuid) from public;
grant execute on function cortex.user_has_niche_access(uuid) to authenticated;
