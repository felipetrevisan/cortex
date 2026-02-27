-- Regra de backend (RLS) para impedir reavaliação da Fase 2 antes de 45 dias
-- com base em diagnostic_cycles.protocol_completed_at.
--
-- Este script aplica a política em qualquer schema que contenha:
--   <schema>.diagnostic_cycles
--   <schema>.phase2_responses
--
-- Suporta cenários com schema "public" e/ou "cortex".

DO $$
DECLARE
  target_schema text;
BEGIN
  FOREACH target_schema IN ARRAY ARRAY['public', 'cortex']
  LOOP
    IF to_regclass(format('%I.phase2_responses', target_schema)) IS NULL
      OR to_regclass(format('%I.diagnostic_cycles', target_schema)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I.phase2_responses ENABLE ROW LEVEL SECURITY', target_schema);

    -- SELECT
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own phase2" ON %I.phase2_responses', target_schema);
    EXECUTE format(
      'CREATE POLICY "Users can view own phase2" ON %I.phase2_responses FOR SELECT USING (auth.uid() = user_id)',
      target_schema
    );

    -- INSERT com gate de 45 dias
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own phase2" ON %I.phase2_responses', target_schema);
    EXECUTE format(
      $policy$
      CREATE POLICY "Users can insert own phase2"
      ON %I.phase2_responses
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM %I.diagnostic_cycles dc
          WHERE dc.id = phase2_responses.cycle_id
            AND dc.user_id = auth.uid()
            AND (
              dc.protocol_completed_at IS NULL
              OR now() >= dc.protocol_completed_at + interval '45 days'
            )
        )
      )
      $policy$,
      target_schema,
      target_schema
    );

    -- UPDATE com gate de 45 dias
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own phase2" ON %I.phase2_responses', target_schema);
    EXECUTE format(
      $policy$
      CREATE POLICY "Users can update own phase2"
      ON %I.phase2_responses
      FOR UPDATE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM %I.diagnostic_cycles dc
          WHERE dc.id = phase2_responses.cycle_id
            AND dc.user_id = auth.uid()
            AND (
              dc.protocol_completed_at IS NULL
              OR now() >= dc.protocol_completed_at + interval '45 days'
            )
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM %I.diagnostic_cycles dc
          WHERE dc.id = phase2_responses.cycle_id
            AND dc.user_id = auth.uid()
            AND (
              dc.protocol_completed_at IS NULL
              OR now() >= dc.protocol_completed_at + interval '45 days'
            )
        )
      )
      $policy$,
      target_schema,
      target_schema
    );
  END LOOP;
END $$;
