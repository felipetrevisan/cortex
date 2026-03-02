create or replace function cortex.admin_reset_user_diagnostic_flow(
  target_user_id uuid,
  target_niche_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = cortex, public
as $$
declare
  target_cycle_ids uuid[] := '{}';
  cycles_deleted_count integer := 0;
  phase1_deleted_count integer := 0;
  phase2_deleted_count integer := 0;
  protocol_deleted_count integer := 0;
begin
  if auth.uid() is null or not cortex.is_admin_user() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'Usuário alvo é obrigatório.';
  end if;

  select coalesce(array_agg(dc.id), '{}'), count(*)
  into target_cycle_ids, cycles_deleted_count
  from cortex.diagnostic_cycles dc
  where dc.user_id = target_user_id
    and (target_niche_id is null or dc.niche_id = target_niche_id);

  if array_length(target_cycle_ids, 1) is not null then
    select count(*)
    into phase1_deleted_count
    from cortex.phase1_responses
    where cycle_id = any(target_cycle_ids);

    select count(*)
    into phase2_deleted_count
    from cortex.phase2_responses
    where cycle_id = any(target_cycle_ids);

    select count(*)
    into protocol_deleted_count
    from cortex.protocol_progress
    where cycle_id = any(target_cycle_ids);

    delete from cortex.diagnostic_cycles
    where id = any(target_cycle_ids);
  end if;

  return jsonb_build_object(
    'user_id', target_user_id,
    'niche_id', target_niche_id,
    'cycles_deleted', cycles_deleted_count,
    'phase1_deleted', phase1_deleted_count,
    'phase2_deleted', phase2_deleted_count,
    'protocol_deleted', protocol_deleted_count
  );
end;
$$;

revoke all on function cortex.admin_reset_user_diagnostic_flow(uuid, uuid) from public;
grant execute on function cortex.admin_reset_user_diagnostic_flow(uuid, uuid) to authenticated;
