'use client'

import { mapDiagnosticNiche } from '@cortex/shared/models/diagnostic-config.model'
import { mapUserNicheAccess } from '@cortex/shared/models/user-niche-access.model'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '../components/auth-provider'
import { useProfileQuery } from './use-profile-query'

interface AccessibleNicheViewModel {
	accessId: string
	nicheId: string
	name: string
	slug: string
	description: string | null
	purchasedAt: Date
	expiresAt: Date | null
}

interface NicheAccessQueryResult {
	niches: AccessibleNicheViewModel[]
}

export const useActiveNicheAccess = () => {
	const { user } = useAuth()
	const profileQuery = useProfileQuery()
	const queryClient = useQueryClient()

	const nicheAccessQuery = useQuery({
		queryKey: queryKeys.auth.nicheAccess(user?.id ?? 'anon'),
		enabled: Boolean(user?.id),
		queryFn: async (): Promise<NicheAccessQueryResult> => {
			if (!user?.id) {
				throw new Error('Usuário não autenticado')
			}

			const supabase = getSupabaseClient()
			const { data: accessRows, error: accessError } = await supabase
				.from('user_niche_access')
				.select('*')
				.eq('user_id', user.id)
				.eq('status', 'active')
				.order('purchased_at', { ascending: true })
				.order('created_at', { ascending: true })

			if (accessError) {
				throw new Error(accessError.message)
			}

			const mappedAccess = (accessRows ?? [])
				.map(mapUserNicheAccess)
				.filter(
					(item) => !item.expiresAt || item.expiresAt.getTime() >= Date.now(),
				)

			if (mappedAccess.length === 0) {
				return { niches: [] }
			}

			const nicheIds = mappedAccess.map((item) => item.nicheId)
			const { data: nicheRows, error: nichesError } = await supabase
				.from('diagnostic_niches')
				.select('*')
				.in('id', nicheIds)
				.eq('is_active', true)

			if (nichesError) {
				throw new Error(nichesError.message)
			}

			const nichesById = new Map(
				(nicheRows ?? []).map((row) => {
					const mapped = mapDiagnosticNiche(row)
					return [mapped.id, mapped] as const
				}),
			)

			const niches = mappedAccess
				.map((access) => {
					const niche = nichesById.get(access.nicheId)
					if (!niche) return null
					return {
						accessId: access.id,
						nicheId: niche.id,
						name: niche.name,
						slug: niche.slug,
						description: niche.description,
						purchasedAt: access.purchasedAt,
						expiresAt: access.expiresAt,
					} satisfies AccessibleNicheViewModel
				})
				.filter((item): item is AccessibleNicheViewModel => Boolean(item))

			return { niches }
		},
	})

	const activeNiche = useMemo(() => {
		const niches = nicheAccessQuery.data?.niches ?? []
		if (niches.length === 0) return null

		const activeNicheId = profileQuery.data?.activeNicheId ?? null
		return (
			niches.find((item) => item.nicheId === activeNicheId) ?? niches[0] ?? null
		)
	}, [nicheAccessQuery.data?.niches, profileQuery.data?.activeNicheId])

	const setActiveNicheMutation = useMutation({
		mutationFn: async (nicheId: string) => {
			if (!user?.id) throw new Error('Usuário não autenticado')

			const hasAccess = (nicheAccessQuery.data?.niches ?? []).some(
				(item) => item.nicheId === nicheId,
			)
			if (!hasAccess) {
				throw new Error('Você não possui acesso a este nicho.')
			}

			const { error } = await getSupabaseClient()
				.from('profiles')
				.update({ active_niche_id: nicheId })
				.eq('user_id', user.id)

			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			if (!user?.id) return

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(user.id),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.nicheAccess(user.id),
				}),
				queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
				queryClient.invalidateQueries({ queryKey: ['diagnostic'] }),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	useEffect(() => {
		if (
			!user?.id ||
			!profileQuery.data ||
			nicheAccessQuery.isLoading ||
			setActiveNicheMutation.isPending
		) {
			return
		}

		if (!activeNiche?.nicheId) return
		if (profileQuery.data.activeNicheId === activeNiche.nicheId) return

		void setActiveNicheMutation.mutateAsync(activeNiche.nicheId)
	}, [
		activeNiche?.nicheId,
		nicheAccessQuery.isLoading,
		profileQuery.data,
		setActiveNicheMutation,
		user?.id,
	])

	return {
		nicheAccessQuery,
		activeNiche,
		availableNiches: nicheAccessQuery.data?.niches ?? [],
		hasAnyNicheAccess: (nicheAccessQuery.data?.niches?.length ?? 0) > 0,
		setActiveNiche: setActiveNicheMutation.mutateAsync,
		isSwitchingNiche: setActiveNicheMutation.isPending,
		isLoading: profileQuery.isLoading || nicheAccessQuery.isLoading,
	}
}
