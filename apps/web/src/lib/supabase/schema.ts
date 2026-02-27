import type { Database as SharedDatabase } from '@cortex/shared/supabase/database.types'

type EnsureCortexSchema<TDatabase extends { public: unknown }> =
	'cortex' extends keyof TDatabase
		? TDatabase
		: TDatabase & { cortex: TDatabase['public'] }

export type AppDatabase = EnsureCortexSchema<SharedDatabase>

export const SUPABASE_DB_SCHEMA = 'cortex' as const
