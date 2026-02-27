-- Gate de 45 dias na Fase 2 baseado em protocol_completed_at

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
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from cortex.diagnostic_cycles dc
    where dc.id = phase2_responses.cycle_id
      and dc.user_id = auth.uid()
      and (
        dc.protocol_completed_at is null
        or now() >= dc.protocol_completed_at + interval '45 days'
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
        or now() >= dc.protocol_completed_at + interval '45 days'
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
        or now() >= dc.protocol_completed_at + interval '45 days'
      )
  )
);
