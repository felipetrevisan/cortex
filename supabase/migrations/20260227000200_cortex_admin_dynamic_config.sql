-- Painel admin dinâmico no schema cortex

create extension if not exists pgcrypto;
create schema if not exists cortex;

alter table cortex.profiles
  add column if not exists role text not null default 'user';

create table if not exists cortex.diagnostic_niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_niches_updated_at on cortex.diagnostic_niches;
create trigger update_diagnostic_niches_updated_at
before update on cortex.diagnostic_niches
for each row execute function cortex.update_updated_at_column();

create table if not exists cortex.diagnostic_phases (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references cortex.diagnostic_niches(id) on delete cascade,
  title text not null,
  phase_type text not null,
  pillar text,
  block_number int,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phases_updated_at on cortex.diagnostic_phases;
create trigger update_diagnostic_phases_updated_at
before update on cortex.diagnostic_phases
for each row execute function cortex.update_updated_at_column();

create table if not exists cortex.diagnostic_phase_questions (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references cortex.diagnostic_phases(id) on delete cascade,
  prompt text not null,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phase_questions_updated_at on cortex.diagnostic_phase_questions;
create trigger update_diagnostic_phase_questions_updated_at
before update on cortex.diagnostic_phase_questions
for each row execute function cortex.update_updated_at_column();

create table if not exists cortex.diagnostic_phase_options (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references cortex.diagnostic_phases(id) on delete cascade,
  label text not null,
  value int not null,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phase_options_updated_at on cortex.diagnostic_phase_options;
create trigger update_diagnostic_phase_options_updated_at
before update on cortex.diagnostic_phase_options
for each row execute function cortex.update_updated_at_column();

alter table cortex.diagnostic_niches enable row level security;
alter table cortex.diagnostic_phases enable row level security;
alter table cortex.diagnostic_phase_questions enable row level security;
alter table cortex.diagnostic_phase_options enable row level security;

create or replace function cortex.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from cortex.profiles p
    where p.user_id = auth.uid()
      and lower(trim(p.role)) = 'admin'
  );
$$;

drop policy if exists "Public can read active niches" on cortex.diagnostic_niches;
create policy "Public can read active niches"
on cortex.diagnostic_niches
for select
using (is_active = true or cortex.is_admin_user());

drop policy if exists "Admin manage niches" on cortex.diagnostic_niches;
create policy "Admin manage niches"
on cortex.diagnostic_niches
for all
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

drop policy if exists "Public can read active phases" on cortex.diagnostic_phases;
create policy "Public can read active phases"
on cortex.diagnostic_phases
for select
using (is_active = true or cortex.is_admin_user());

drop policy if exists "Admin manage phases" on cortex.diagnostic_phases;
create policy "Admin manage phases"
on cortex.diagnostic_phases
for all
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

drop policy if exists "Public can read active phase questions" on cortex.diagnostic_phase_questions;
create policy "Public can read active phase questions"
on cortex.diagnostic_phase_questions
for select
using (is_active = true or cortex.is_admin_user());

drop policy if exists "Admin manage phase questions" on cortex.diagnostic_phase_questions;
create policy "Admin manage phase questions"
on cortex.diagnostic_phase_questions
for all
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

drop policy if exists "Public can read active phase options" on cortex.diagnostic_phase_options;
create policy "Public can read active phase options"
on cortex.diagnostic_phase_options
for select
using (is_active = true or cortex.is_admin_user());

drop policy if exists "Admin manage phase options" on cortex.diagnostic_phase_options;
create policy "Admin manage phase options"
on cortex.diagnostic_phase_options
for all
using (cortex.is_admin_user())
with check (cortex.is_admin_user());

create index if not exists idx_cortex_diagnostic_phases_niche
  on cortex.diagnostic_phases(niche_id, phase_type, order_index);
create index if not exists idx_cortex_phase_questions_phase
  on cortex.diagnostic_phase_questions(phase_id, order_index);
create index if not exists idx_cortex_phase_options_phase
  on cortex.diagnostic_phase_options(phase_id, order_index);
