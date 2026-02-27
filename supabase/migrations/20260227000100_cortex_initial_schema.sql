-- CORTEX baseline schema (core tables + auth profile trigger)

create extension if not exists pgcrypto;
create schema if not exists cortex;

create or replace function cortex.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists cortex.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null default '',
  role text not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cortex.profiles enable row level security;

drop policy if exists "Users can view own profile" on cortex.profiles;
create policy "Users can view own profile"
on cortex.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on cortex.profiles;
create policy "Users can insert own profile"
on cortex.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on cortex.profiles;
create policy "Users can update own profile"
on cortex.profiles
for update
using (auth.uid() = user_id);

drop trigger if exists update_profiles_updated_at on cortex.profiles;
create trigger update_profiles_updated_at
before update on cortex.profiles
for each row execute function cortex.update_updated_at_column();

create or replace function cortex.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = cortex, public
as $$
begin
  insert into cortex.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created_cortex_profile'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    return;
  end if;

  create trigger on_auth_user_created_cortex_profile
  after insert on auth.users
  for each row execute function cortex.handle_new_user();
end
$$;

create table if not exists cortex.diagnostic_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  cycle_number integer not null default 1,
  started_at timestamptz not null default now(),
  phase1_completed_at timestamptz,
  phase2_completed_at timestamptz,
  protocol_completed_at timestamptz,
  reeval_45_completed_at timestamptz,
  reeval_90_completed_at timestamptz,
  pillar_clarity numeric,
  pillar_structure numeric,
  pillar_execution numeric,
  pillar_emotional numeric,
  general_index numeric,
  critical_pillar text,
  strong_pillar text,
  phase2_technical_index numeric,
  phase2_state_index numeric,
  phase2_general_index numeric,
  status text not null default 'phase1_pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cortex.diagnostic_cycles enable row level security;

drop policy if exists "Users can view own cycles" on cortex.diagnostic_cycles;
create policy "Users can view own cycles"
on cortex.diagnostic_cycles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cycles" on cortex.diagnostic_cycles;
create policy "Users can insert own cycles"
on cortex.diagnostic_cycles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cycles" on cortex.diagnostic_cycles;
create policy "Users can update own cycles"
on cortex.diagnostic_cycles
for update
using (auth.uid() = user_id);

drop trigger if exists update_cycles_updated_at on cortex.diagnostic_cycles;
create trigger update_cycles_updated_at
before update on cortex.diagnostic_cycles
for each row execute function cortex.update_updated_at_column();

create table if not exists cortex.phase1_responses (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cortex.diagnostic_cycles(id) on delete cascade,
  user_id uuid not null,
  pillar text not null,
  question_number integer not null,
  score integer not null check (score >= 1 and score <= 6),
  created_at timestamptz not null default now()
);

alter table cortex.phase1_responses enable row level security;

drop policy if exists "Users can view own phase1" on cortex.phase1_responses;
create policy "Users can view own phase1"
on cortex.phase1_responses
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own phase1" on cortex.phase1_responses;
create policy "Users can insert own phase1"
on cortex.phase1_responses
for insert
with check (auth.uid() = user_id);

create table if not exists cortex.phase2_responses (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cortex.diagnostic_cycles(id) on delete cascade,
  user_id uuid not null,
  question_type text not null,
  question_number integer not null,
  score integer not null check (score >= 1 and score <= 6),
  created_at timestamptz not null default now()
);

alter table cortex.phase2_responses enable row level security;

drop policy if exists "Users can view own phase2" on cortex.phase2_responses;
create policy "Users can view own phase2"
on cortex.phase2_responses
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own phase2" on cortex.phase2_responses;
create policy "Users can insert own phase2"
on cortex.phase2_responses
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own phase2" on cortex.phase2_responses;
create policy "Users can update own phase2"
on cortex.phase2_responses
for update
using (auth.uid() = user_id);

create table if not exists cortex.protocol_progress (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cortex.diagnostic_cycles(id) on delete cascade,
  user_id uuid not null,
  reflections jsonb default '[]'::jsonb,
  block1_actions boolean[] default array[false, false, false],
  block2_actions boolean[] default array[false, false, false],
  block3_actions boolean[] default array[false, false, false],
  current_block integer not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cortex.protocol_progress enable row level security;

drop policy if exists "Users can view own protocol" on cortex.protocol_progress;
create policy "Users can view own protocol"
on cortex.protocol_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own protocol" on cortex.protocol_progress;
create policy "Users can insert own protocol"
on cortex.protocol_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own protocol" on cortex.protocol_progress;
create policy "Users can update own protocol"
on cortex.protocol_progress
for update
using (auth.uid() = user_id);

drop trigger if exists update_protocol_updated_at on cortex.protocol_progress;
create trigger update_protocol_updated_at
before update on cortex.protocol_progress
for each row execute function cortex.update_updated_at_column();

create index if not exists idx_cortex_diagnostic_cycles_user_id
  on cortex.diagnostic_cycles(user_id);
create index if not exists idx_cortex_phase1_responses_cycle_user
  on cortex.phase1_responses(cycle_id, user_id);
create index if not exists idx_cortex_phase2_responses_cycle_user
  on cortex.phase2_responses(cycle_id, user_id);
create index if not exists idx_cortex_protocol_progress_cycle_user
  on cortex.protocol_progress(cycle_id, user_id);
