-- Multi-nicho: acesso por usuário + escopo por nicho em todo o ciclo CORTEX

create schema if not exists cortex;

create table if not exists cortex.user_niche_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  niche_id uuid not null references cortex.diagnostic_niches(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'blocked')),
  source text,
  order_id text,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, niche_id)
);

drop trigger if exists update_user_niche_access_updated_at on cortex.user_niche_access;
create trigger update_user_niche_access_updated_at
before update on cortex.user_niche_access
for each row execute function cortex.update_updated_at_column();

alter table cortex.profiles
  add column if not exists active_niche_id uuid references cortex.diagnostic_niches(id) on delete set null;

alter table cortex.diagnostic_cycles
  add column if not exists niche_id uuid references cortex.diagnostic_niches(id) on delete restrict;

alter table cortex.phase1_responses
  add column if not exists niche_id uuid references cortex.diagnostic_niches(id) on delete restrict;

alter table cortex.phase2_responses
  add column if not exists niche_id uuid references cortex.diagnostic_niches(id) on delete restrict;

alter table cortex.protocol_progress
  add column if not exists niche_id uuid references cortex.diagnostic_niches(id) on delete restrict;

with fallback_niche as (
  select id
  from cortex.diagnostic_niches
  where is_active = true
  order by created_at asc
  limit 1
)
update cortex.diagnostic_cycles c
set niche_id = fallback_niche.id
from fallback_niche
where c.niche_id is null;

update cortex.phase1_responses r
set niche_id = c.niche_id
from cortex.diagnostic_cycles c
where c.id = r.cycle_id
  and r.niche_id is null;

update cortex.phase2_responses r
set niche_id = c.niche_id
from cortex.diagnostic_cycles c
where c.id = r.cycle_id
  and r.niche_id is null;

update cortex.protocol_progress p
set niche_id = c.niche_id
from cortex.diagnostic_cycles c
where c.id = p.cycle_id
  and p.niche_id is null;

insert into cortex.user_niche_access (user_id, niche_id, source)
select distinct p.user_id, n.id, 'migration_seed'
from cortex.profiles p
cross join lateral (
  select id
  from cortex.diagnostic_niches
  where is_active = true
  order by created_at asc
  limit 1
) n
on conflict (user_id, niche_id) do nothing;

update cortex.profiles p
set active_niche_id = una.niche_id
from (
  select distinct on (user_id) user_id, niche_id
  from cortex.user_niche_access
  where status = 'active'
    and (expires_at is null or expires_at >= now())
  order by user_id, purchased_at asc, created_at asc
) una
where p.user_id = una.user_id
  and p.active_niche_id is null;

create or replace function cortex.user_has_niche_access(target_niche_id uuid)
returns boolean
language sql
stable
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

create or replace function cortex.sync_niche_from_cycle()
returns trigger
language plpgsql
security definer
set search_path = cortex, public
as $$
declare
  cycle_niche uuid;
begin
  select c.niche_id into cycle_niche
  from cortex.diagnostic_cycles c
  where c.id = new.cycle_id;

  if cycle_niche is null then
    raise exception 'Ciclo % sem niche_id definido', new.cycle_id;
  end if;

  if new.niche_id is null then
    new.niche_id := cycle_niche;
  elsif new.niche_id <> cycle_niche then
    raise exception 'niche_id inconsistente para cycle_id %', new.cycle_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_phase1_niche_from_cycle on cortex.phase1_responses;
create trigger sync_phase1_niche_from_cycle
before insert or update of cycle_id, niche_id on cortex.phase1_responses
for each row execute function cortex.sync_niche_from_cycle();

drop trigger if exists sync_phase2_niche_from_cycle on cortex.phase2_responses;
create trigger sync_phase2_niche_from_cycle
before insert or update of cycle_id, niche_id on cortex.phase2_responses
for each row execute function cortex.sync_niche_from_cycle();

drop trigger if exists sync_protocol_niche_from_cycle on cortex.protocol_progress;
create trigger sync_protocol_niche_from_cycle
before insert or update of cycle_id, niche_id on cortex.protocol_progress
for each row execute function cortex.sync_niche_from_cycle();

alter table cortex.user_niche_access enable row level security;

drop policy if exists "Users can view own niche access" on cortex.user_niche_access;
create policy "Users can view own niche access"
on cortex.user_niche_access
for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage niche access" on cortex.user_niche_access;
create policy "Admins manage niche access"
on cortex.user_niche_access
for all
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

drop policy if exists "Users can update own profile" on cortex.profiles;
create policy "Users can update own profile"
on cortex.profiles
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (active_niche_id is null or cortex.user_has_niche_access(active_niche_id))
);

drop policy if exists "Users can view own cycles" on cortex.diagnostic_cycles;
create policy "Users can view own cycles"
on cortex.diagnostic_cycles
for select
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
);

drop policy if exists "Users can insert own cycles" on cortex.diagnostic_cycles;
create policy "Users can insert own cycles"
on cortex.diagnostic_cycles
for insert
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can update own cycles" on cortex.diagnostic_cycles;
create policy "Users can update own cycles"
on cortex.diagnostic_cycles
for update
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
)
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can view own phase1" on cortex.phase1_responses;
create policy "Users can view own phase1"
on cortex.phase1_responses
for select
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
);

drop policy if exists "Users can insert own phase1" on cortex.phase1_responses;
create policy "Users can insert own phase1"
on cortex.phase1_responses
for insert
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can update own phase1" on cortex.phase1_responses;
create policy "Users can update own phase1"
on cortex.phase1_responses
for update
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
)
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can view own phase2" on cortex.phase2_responses;
create policy "Users can view own phase2"
on cortex.phase2_responses
for select
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
);

drop policy if exists "Users can insert own phase2" on cortex.phase2_responses;
create policy "Users can insert own phase2"
on cortex.phase2_responses
for insert
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can update own phase2" on cortex.phase2_responses;
create policy "Users can update own phase2"
on cortex.phase2_responses
for update
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
)
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can view own protocol" on cortex.protocol_progress;
create policy "Users can view own protocol"
on cortex.protocol_progress
for select
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
);

drop policy if exists "Users can insert own protocol" on cortex.protocol_progress;
create policy "Users can insert own protocol"
on cortex.protocol_progress
for insert
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Users can update own protocol" on cortex.protocol_progress;
create policy "Users can update own protocol"
on cortex.protocol_progress
for update
using (
  auth.uid() = user_id
  and (niche_id is null or cortex.user_has_niche_access(niche_id))
)
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
);

drop policy if exists "Public can read active niches" on cortex.diagnostic_niches;
create policy "Users can read accessible niches"
on cortex.diagnostic_niches
for select
using (
  cortex.is_admin_user()
  or exists (
    select 1
    from cortex.user_niche_access una
    where una.user_id = auth.uid()
      and una.niche_id = id
      and una.status = 'active'
      and (una.expires_at is null or una.expires_at >= now())
  )
);

drop policy if exists "Public can read active phases" on cortex.diagnostic_phases;
create policy "Users can read accessible phases"
on cortex.diagnostic_phases
for select
using (cortex.is_admin_user() or cortex.user_has_niche_access(niche_id));

drop policy if exists "Public can read active phase questions" on cortex.diagnostic_phase_questions;
create policy "Users can read accessible phase questions"
on cortex.diagnostic_phase_questions
for select
using (
  cortex.is_admin_user()
  or exists (
    select 1
    from cortex.diagnostic_phases p
    where p.id = phase_id
      and cortex.user_has_niche_access(p.niche_id)
  )
);

drop policy if exists "Public can read active phase options" on cortex.diagnostic_phase_options;
create policy "Users can read accessible phase options"
on cortex.diagnostic_phase_options
for select
using (
  cortex.is_admin_user()
  or exists (
    select 1
    from cortex.diagnostic_phases p
    where p.id = phase_id
      and cortex.user_has_niche_access(p.niche_id)
  )
);

create index if not exists idx_cortex_user_niche_access_user
  on cortex.user_niche_access(user_id, status, niche_id);

create index if not exists idx_cortex_diagnostic_cycles_user_niche
  on cortex.diagnostic_cycles(user_id, niche_id, cycle_number desc);

create index if not exists idx_cortex_phase1_responses_user_niche
  on cortex.phase1_responses(user_id, niche_id, cycle_id);

create index if not exists idx_cortex_phase2_responses_user_niche
  on cortex.phase2_responses(user_id, niche_id, cycle_id);

create index if not exists idx_cortex_protocol_progress_user_niche
  on cortex.protocol_progress(user_id, niche_id, cycle_id);
