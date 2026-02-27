-- Painel Admin + Configuração Dinâmica de Diagnóstico
-- Execute no Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Role em profiles para RBAC
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Helper para updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Nichos
create table if not exists public.diagnostic_niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_niches_updated_at on public.diagnostic_niches;
create trigger update_diagnostic_niches_updated_at
before update on public.diagnostic_niches
for each row execute function public.update_updated_at_column();

-- Fases
create table if not exists public.diagnostic_phases (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.diagnostic_niches(id) on delete cascade,
  title text not null,
  phase_type text not null, -- phase1 | phase2_technical | phase2_state | protocol_reflection | protocol_action
  pillar text, -- clarity | structure | execution | emotional
  block_number int,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phases_updated_at on public.diagnostic_phases;
create trigger update_diagnostic_phases_updated_at
before update on public.diagnostic_phases
for each row execute function public.update_updated_at_column();

-- Perguntas por fase
create table if not exists public.diagnostic_phase_questions (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.diagnostic_phases(id) on delete cascade,
  prompt text not null,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phase_questions_updated_at on public.diagnostic_phase_questions;
create trigger update_diagnostic_phase_questions_updated_at
before update on public.diagnostic_phase_questions
for each row execute function public.update_updated_at_column();

-- Opções de resposta por fase (botões)
create table if not exists public.diagnostic_phase_options (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.diagnostic_phases(id) on delete cascade,
  label text not null,
  value int not null,
  order_index int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_diagnostic_phase_options_updated_at on public.diagnostic_phase_options;
create trigger update_diagnostic_phase_options_updated_at
before update on public.diagnostic_phase_options
for each row execute function public.update_updated_at_column();

-- RLS
alter table public.diagnostic_niches enable row level security;
alter table public.diagnostic_phases enable row level security;
alter table public.diagnostic_phase_questions enable row level security;
alter table public.diagnostic_phase_options enable row level security;

-- Função helper de admin
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Niches policies
drop policy if exists "Public can read active niches" on public.diagnostic_niches;
create policy "Public can read active niches"
on public.diagnostic_niches
for select
using (is_active = true or public.is_admin_user());

drop policy if exists "Admin manage niches" on public.diagnostic_niches;
create policy "Admin manage niches"
on public.diagnostic_niches
for all
using (public.is_admin_user())
with check (public.is_admin_user());

-- Phases policies
drop policy if exists "Public can read active phases" on public.diagnostic_phases;
create policy "Public can read active phases"
on public.diagnostic_phases
for select
using (is_active = true or public.is_admin_user());

drop policy if exists "Admin manage phases" on public.diagnostic_phases;
create policy "Admin manage phases"
on public.diagnostic_phases
for all
using (public.is_admin_user())
with check (public.is_admin_user());

-- Questions policies
drop policy if exists "Public can read active phase questions" on public.diagnostic_phase_questions;
create policy "Public can read active phase questions"
on public.diagnostic_phase_questions
for select
using (is_active = true or public.is_admin_user());

drop policy if exists "Admin manage phase questions" on public.diagnostic_phase_questions;
create policy "Admin manage phase questions"
on public.diagnostic_phase_questions
for all
using (public.is_admin_user())
with check (public.is_admin_user());

-- Options policies
drop policy if exists "Public can read active phase options" on public.diagnostic_phase_options;
create policy "Public can read active phase options"
on public.diagnostic_phase_options
for select
using (is_active = true or public.is_admin_user());

drop policy if exists "Admin manage phase options" on public.diagnostic_phase_options;
create policy "Admin manage phase options"
on public.diagnostic_phase_options
for all
using (public.is_admin_user())
with check (public.is_admin_user());
