-- Configuracao temporal e oferta de recompra por nicho

alter table cortex.diagnostic_niches
  add column if not exists phase2_reevaluation_days integer not null default 45,
  add column if not exists new_cycle_days integer not null default 90,
  add column if not exists repurchase_price_cents integer,
  add column if not exists repurchase_checkout_url text;

alter table cortex.diagnostic_niches
  drop constraint if exists diagnostic_niches_phase2_reevaluation_days_check;

alter table cortex.diagnostic_niches
  add constraint diagnostic_niches_phase2_reevaluation_days_check
  check (phase2_reevaluation_days >= 1);

alter table cortex.diagnostic_niches
  drop constraint if exists diagnostic_niches_new_cycle_days_check;

alter table cortex.diagnostic_niches
  add constraint diagnostic_niches_new_cycle_days_check
  check (new_cycle_days >= 1);

alter table cortex.diagnostic_niches
  drop constraint if exists diagnostic_niches_repurchase_price_cents_check;

alter table cortex.diagnostic_niches
  add constraint diagnostic_niches_repurchase_price_cents_check
  check (repurchase_price_cents is null or repurchase_price_cents >= 0);

create or replace function cortex.get_phase2_reevaluation_days(target_niche_id uuid)
returns integer
language sql
stable
security definer
set search_path = cortex, public
as $$
  select coalesce(n.phase2_reevaluation_days, 45)
  from cortex.diagnostic_niches n
  where n.id = target_niche_id
  limit 1
$$;

create or replace function cortex.get_new_cycle_days(target_niche_id uuid)
returns integer
language sql
stable
security definer
set search_path = cortex, public
as $$
  select coalesce(n.new_cycle_days, 90)
  from cortex.diagnostic_niches n
  where n.id = target_niche_id
  limit 1
$$;

create or replace function cortex.can_start_new_cycle(target_niche_id uuid)
returns boolean
language sql
stable
security definer
set search_path = cortex, public
as $$
  with latest_cycle as (
    select dc.*
    from cortex.diagnostic_cycles dc
    where dc.user_id = auth.uid()
      and dc.niche_id = target_niche_id
    order by dc.cycle_number desc, dc.created_at desc
    limit 1
  )
  select case
    when not exists (select 1 from latest_cycle) then true
    else exists (
      select 1
      from latest_cycle lc
      where lc.phase1_completed_at is not null
        and lc.protocol_completed_at is not null
        and now() >= lc.phase1_completed_at + make_interval(days => cortex.get_new_cycle_days(target_niche_id))
    )
  end
$$;

revoke all on function cortex.get_phase2_reevaluation_days(uuid) from public;
grant execute on function cortex.get_phase2_reevaluation_days(uuid) to authenticated;

revoke all on function cortex.get_new_cycle_days(uuid) from public;
grant execute on function cortex.get_new_cycle_days(uuid) to authenticated;

revoke all on function cortex.can_start_new_cycle(uuid) from public;
grant execute on function cortex.can_start_new_cycle(uuid) to authenticated;

alter table cortex.phase2_responses enable row level security;

drop policy if exists "Users can insert own phase2" on cortex.phase2_responses;
create policy "Users can insert own phase2"
on cortex.phase2_responses
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from cortex.diagnostic_cycles dc
    where dc.id = phase2_responses.cycle_id
      and dc.user_id = auth.uid()
      and (
        dc.protocol_completed_at is null
        or now() >= dc.protocol_completed_at + make_interval(days => cortex.get_phase2_reevaluation_days(dc.niche_id))
      )
  )
);

drop policy if exists "Users can update own phase2" on cortex.phase2_responses;
create policy "Users can update own phase2"
on cortex.phase2_responses
for update
using (
  auth.uid() = user_id
  and exists (
    select 1
    from cortex.diagnostic_cycles dc
    where dc.id = phase2_responses.cycle_id
      and dc.user_id = auth.uid()
      and (
        dc.protocol_completed_at is null
        or now() >= dc.protocol_completed_at + make_interval(days => cortex.get_phase2_reevaluation_days(dc.niche_id))
      )
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from cortex.diagnostic_cycles dc
    where dc.id = phase2_responses.cycle_id
      and dc.user_id = auth.uid()
      and (
        dc.protocol_completed_at is null
        or now() >= dc.protocol_completed_at + make_interval(days => cortex.get_phase2_reevaluation_days(dc.niche_id))
      )
  )
);

drop policy if exists "Users can insert own cycles" on cortex.diagnostic_cycles;
create policy "Users can insert own cycles"
on cortex.diagnostic_cycles
for insert
with check (
  auth.uid() = user_id
  and niche_id is not null
  and cortex.user_has_niche_access(niche_id)
  and cortex.can_start_new_cycle(niche_id)
);
