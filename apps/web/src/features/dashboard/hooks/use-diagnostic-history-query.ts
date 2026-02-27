'use client'

import { computeDiagnosticTemporalRules } from '@cortex/shared/domain/diagnostic-temporal-rules'
import {
	type DiagnosticCycleModel,
	mapDiagnosticCycle,
} from '@cortex/shared/models/diagnostic-cycle.model'
import {
	mapProtocolProgress,
	toStrategicPlanProgress,
} from '@cortex/shared/models/protocol-progress.model'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface DiagnosticHistoryItem {
	cycle: DiagnosticCycleModel
	statusLabel: string
	nextAction: string
	completedActions: number
	totalActions: number
	timeline: {
		startedAt: Date
		protocolCompletedAt: Date | null
		protocolAuditMessage: string
		reeval45AvailableAt: Date | null
		reeval45Countdown: string
		reeval45AuditMessage: string
		newDiagnosticAvailableAt: Date | null
	}
}

const statusLabelMap: Record<string, string> = {
	phase1_in_progress: 'Fase 1 em andamento',
	phase1_tie_pending: 'Aguardando desempate',
	phase2_in_progress: 'Fase 2 em andamento',
	protocol_in_progress: 'Protocolo em andamento',
	protocol_completed: 'Ciclo concluído',
	reeval_45_completed: 'Reavaliação concluída',
}

const toStatusLabel = (status: string): string =>
	statusLabelMap[status] ?? 'Em andamento'

const formatDate = (
	value: Date | string | number | null | undefined,
): string => {
	if (value == null) return '-'
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(parsed)
}

const inferNextAction = (
	cycle: DiagnosticCycleModel,
	temporalMessage45: string,
	temporalMessage90: string,
	canRunReevaluation: boolean,
	canStartNewCycle: boolean,
): string => {
	if (!cycle.timeline.phase1CompletedAt) return 'Continuar Fase 1'
	if (!cycle.timeline.phase2CompletedAt) return 'Continuar Fase 2'
	if (!cycle.timeline.protocolCompletedAt) return 'Continuar Protocolo'
	if (canRunReevaluation) return 'Executar reavaliação da Fase 2'
	if (!cycle.timeline.reeval45CompletedAt) return temporalMessage45
	if (!canStartNewCycle) return temporalMessage90
	return 'Iniciar novo diagnóstico estrutural'
}

export const useDiagnosticHistoryQuery = () => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()

	return useQuery({
		queryKey: queryKeys.dashboard.cycles(
			user?.id ?? 'anon',
			activeNiche?.nicheId ?? 'no-niche',
		),
		enabled: Boolean(user?.id && activeNiche?.nicheId),
		queryFn: async (): Promise<DiagnosticHistoryItem[]> => {
			if (!user?.id || !activeNiche?.nicheId) {
				throw new Error('Usuário não autenticado')
			}

			const supabase = getSupabaseClient()

			const [
				{ data: cycles, error: cyclesError },
				{ data: protocols, error: protocolsError },
			] = await Promise.all([
				supabase
					.from('diagnostic_cycles')
					.select('*')
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId)
					.order('cycle_number', { ascending: false }),
				supabase
					.from('protocol_progress')
					.select('*')
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId),
			])

			if (cyclesError) {
				throw new Error(cyclesError.message)
			}

			if (protocolsError) {
				throw new Error(protocolsError.message)
			}

			const protocolsByCycle = new Map<
				string,
				ReturnType<typeof mapProtocolProgress>
			>()
			;(protocols ?? []).forEach((row) => {
				const model = mapProtocolProgress(row)
				const existing = protocolsByCycle.get(model.cycleId)
				if (
					!existing ||
					model.updatedAt.getTime() > existing.updatedAt.getTime()
				) {
					protocolsByCycle.set(model.cycleId, model)
				}
			})

			return (cycles ?? []).map((row) => {
				const cycle = mapDiagnosticCycle(row)
				const protocol = protocolsByCycle.get(cycle.id)
				const progress = protocol
					? toStrategicPlanProgress(protocol)
					: { completedActions: 0, totalActions: 9, ratioLabel: '0 / 9' }
				const temporalRules = computeDiagnosticTemporalRules({
					phase1CompletedAt: cycle.timeline.phase1CompletedAt,
					protocolCompletedAt: cycle.timeline.protocolCompletedAt,
					reeval45CompletedAt: cycle.timeline.reeval45CompletedAt,
				})

				return {
					cycle,
					statusLabel: toStatusLabel(cycle.status),
					nextAction: inferNextAction(
						cycle,
						temporalRules.phase2Reevaluation.message,
						temporalRules.newStructuralDiagnosis.message,
						temporalRules.canRunPhase2Reevaluation,
						temporalRules.canStartNewCycle,
					),
					completedActions: progress.completedActions,
					totalActions: progress.totalActions,
					timeline: {
						startedAt: cycle.startedAt,
						protocolCompletedAt: cycle.timeline.protocolCompletedAt,
						protocolAuditMessage: cycle.timeline.protocolCompletedAt
							? `Protocolo concluído em ${formatDate(cycle.timeline.protocolCompletedAt)}.`
							: 'Protocolo ainda não concluído.',
						reeval45AvailableAt: temporalRules.phase2Reevaluation.availableAt,
						reeval45Countdown: temporalRules.phase2Reevaluation.isLocked
							? temporalRules.phase2Reevaluation.message
							: 'Reavaliação liberada',
						reeval45AuditMessage: !cycle.timeline.protocolCompletedAt
							? 'Reavaliação Fase 2 disponível após conclusão do protocolo.'
							: `Reavaliação Fase 2 disponível em ${temporalRules.phase2Reevaluation.daysRemaining ?? 0} dias.`,
						newDiagnosticAvailableAt:
							temporalRules.newStructuralDiagnosis.availableAt,
					},
				}
			})
		},
	})
}
