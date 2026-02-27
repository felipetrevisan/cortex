'use client'

import {
	inferRecommendedStep,
	mapProtocolProgress,
	type ProtocolProgressModel,
	toStrategicPlanProgress,
} from '@cortex/shared/models/protocol-progress.model'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'
import { safeStorage } from '@/lib/utils/storage'

interface ResumeCheckpoint {
	currentBlock: number
	block1Actions: boolean[]
	block2Actions: boolean[]
	block3Actions: boolean[]
	cycleId: string
	updatedAt: string
}

interface ProtocolViewModel {
	model: ProtocolProgressModel
	strategicProgress: ReturnType<typeof toStrategicPlanProgress>
	nextStep: string
}

const getCheckpointKey = (userId: string, nicheId: string) =>
	`cortex.protocol.checkpoint.${userId}.${nicheId}`

const createFallbackProtocol = (
	userId: string,
	checkpoint: ResumeCheckpoint | null,
): ProtocolProgressModel => {
	const now = new Date()
	const fallback: ProtocolProgressModel = {
		id: `local-${userId}`,
		cycleId: checkpoint?.cycleId ?? `pending-${userId}`,
		userId,
		currentBlock: checkpoint?.currentBlock ?? 1,
		blockActions: {
			block1: checkpoint?.block1Actions ?? [false, false, false],
			block2: checkpoint?.block2Actions ?? [false, false, false],
			block3: checkpoint?.block3Actions ?? [false, false, false],
		},
		reflections: null,
		completedAt: null,
		createdAt: now,
		updatedAt: now,
	}

	return fallback
}

const toViewModel = (model: ProtocolProgressModel): ProtocolViewModel => ({
	model,
	strategicProgress: toStrategicPlanProgress(model),
	nextStep: inferRecommendedStep(model.currentBlock),
})

const toIsoDateString = (value: unknown): string => {
	if (value instanceof Date) return value.toISOString()
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value)
		if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
	}
	return new Date().toISOString()
}

export const useProtocolProgressQuery = () => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()

	const query = useQuery({
		queryKey: queryKeys.dashboard.protocol(
			user?.id ?? 'anon',
			activeNiche?.nicheId ?? 'no-niche',
		),
		enabled: Boolean(user?.id && activeNiche?.nicheId),
		queryFn: async (): Promise<ProtocolViewModel> => {
			if (!user?.id || !activeNiche?.nicheId) {
				throw new Error('Usuário não autenticado')
			}

			const checkpoint = safeStorage.get<ResumeCheckpoint | null>(
				getCheckpointKey(user.id, activeNiche.nicheId),
				null,
			)

			const { data, error } = await getSupabaseClient()
				.from('protocol_progress')
				.select('*')
				.eq('user_id', user.id)
				.eq('niche_id', activeNiche.nicheId)
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle()

			if (error) {
				return toViewModel(createFallbackProtocol(user.id, checkpoint))
			}

			const model = data
				? mapProtocolProgress(data)
				: createFallbackProtocol(user.id, checkpoint)
			return toViewModel(model)
		},
	})

	useEffect(() => {
		if (!user?.id || !activeNiche?.nicheId || !query.data?.model) return

		const { model } = query.data
		safeStorage.set<ResumeCheckpoint>(
			getCheckpointKey(user.id, activeNiche.nicheId),
			{
				currentBlock: model.currentBlock,
				block1Actions: model.blockActions.block1,
				block2Actions: model.blockActions.block2,
				block3Actions: model.blockActions.block3,
				cycleId: model.cycleId,
				updatedAt: toIsoDateString(model.updatedAt),
			},
		)
	}, [activeNiche?.nicheId, query.data, user?.id])

	return query
}
