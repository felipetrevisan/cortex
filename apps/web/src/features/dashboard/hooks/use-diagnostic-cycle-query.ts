'use client'

import {
	type DiagnosticCycleModel,
	mapDiagnosticCycle,
} from '@cortex/shared/models/diagnostic-cycle.model'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'

export const useDiagnosticCycleQuery = () => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()

	return useQuery({
		queryKey: queryKeys.dashboard.cycle(
			user?.id ?? 'anon',
			activeNiche?.nicheId ?? 'no-niche',
		),
		enabled: Boolean(user?.id && activeNiche?.nicheId),
		queryFn: async (): Promise<DiagnosticCycleModel | null> => {
			if (!user?.id || !activeNiche?.nicheId) {
				throw new Error('Usuário não autenticado')
			}

			const { data, error } = await getSupabaseClient()
				.from('diagnostic_cycles')
				.select('*')
				.eq('user_id', user.id)
				.eq('niche_id', activeNiche.nicheId)
				.order('cycle_number', { ascending: false })
				.limit(1)
				.maybeSingle()

			if (error) {
				throw new Error(error.message)
			}

			return data ? mapDiagnosticCycle(data) : null
		},
	})
}
