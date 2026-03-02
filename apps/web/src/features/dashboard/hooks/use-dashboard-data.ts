'use client'

import { computeDiagnosticTemporalRules } from '@cortex/shared/domain/diagnostic-temporal-rules'
import { useMemo } from 'react'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { useProfileQuery } from '@/features/auth/hooks/use-profile-query'
import { resolveIsAdmin } from '@/features/auth/lib/role'
import { useComparativeReport } from './use-comparative-report'
import { useDiagnosticCycleQuery } from './use-diagnostic-cycle-query'
import { useProtocolProgressQuery } from './use-protocol-progress-query'

export type CortexAchievementStatus = 'completed' | 'active' | 'locked'

export interface CortexAchievementItem {
	key: 'diagnostic' | 'next-level' | 'protocol' | 'reevaluation'
	title: 'Diagnóstico' | 'Próximo Nível' | 'Protocolo' | 'Reavaliação'
	status: CortexAchievementStatus
}

interface DashboardCtaContent {
	label: string
	title: string
	description: string
}

const resolveAchievements = ({
	hasNicheAccess,
	cycle,
	canRunReevaluation,
}: {
	hasNicheAccess: boolean
	cycle: {
		timeline: {
			phase1CompletedAt: Date | null
			phase2CompletedAt: Date | null
			protocolCompletedAt: Date | null
			reeval45CompletedAt: Date | null
		}
	} | null
	canRunReevaluation: boolean
}): CortexAchievementItem[] => {
	if (!hasNicheAccess) {
		return [
			{ key: 'diagnostic', title: 'Diagnóstico', status: 'locked' },
			{ key: 'next-level', title: 'Próximo Nível', status: 'locked' },
			{ key: 'protocol', title: 'Protocolo', status: 'locked' },
			{ key: 'reevaluation', title: 'Reavaliação', status: 'locked' },
		]
	}

	if (!cycle) {
		return [
			{ key: 'diagnostic', title: 'Diagnóstico', status: 'active' },
			{ key: 'next-level', title: 'Próximo Nível', status: 'locked' },
			{ key: 'protocol', title: 'Protocolo', status: 'locked' },
			{ key: 'reevaluation', title: 'Reavaliação', status: 'locked' },
		]
	}

	const phase1Done = Boolean(cycle.timeline.phase1CompletedAt)
	const phase2Done = Boolean(cycle.timeline.phase2CompletedAt)
	const protocolDone = Boolean(cycle.timeline.protocolCompletedAt)
	const reevalDone = Boolean(cycle.timeline.reeval45CompletedAt)

	return [
		{
			key: 'diagnostic',
			title: 'Diagnóstico',
			status: phase1Done ? 'completed' : 'active',
		},
		{
			key: 'next-level',
			title: 'Próximo Nível',
			status: phase2Done ? 'completed' : phase1Done ? 'active' : 'locked',
		},
		{
			key: 'protocol',
			title: 'Protocolo',
			status: protocolDone ? 'completed' : phase2Done ? 'active' : 'locked',
		},
		{
			key: 'reevaluation',
			title: 'Reavaliação',
			status: reevalDone
				? 'completed'
				: protocolDone && canRunReevaluation
					? 'active'
					: 'locked',
		},
	]
}

const getActiveAchievement = (achievements: CortexAchievementItem[]) =>
	achievements.find((item) => item.status === 'active') ?? null

const resolveAchievementCta = ({
	activeAchievement,
	cycleStatus,
	hasStartedDiagnostic,
	phase2ReevaluationDays,
	newCycleDays,
	temporalRules,
	isCycleCompleted,
	repurchasePriceLabel,
	repurchaseCheckoutUrl,
}: {
	activeAchievement: CortexAchievementItem | null
	cycleStatus: string | null
	hasStartedDiagnostic: boolean
	phase2ReevaluationDays?: number
	newCycleDays?: number
	temporalRules?: ReturnType<typeof computeDiagnosticTemporalRules>
	isCycleCompleted: boolean
	repurchasePriceLabel?: string | null
	repurchaseCheckoutUrl?: string | null
}): DashboardCtaContent => {
	if (!hasStartedDiagnostic) {
		return {
			label: 'Iniciar Diagnóstico',
			title: 'Diagnóstico',
			description:
				'Comece sua primeira avaliação estrutural caso não tenha iniciado o diagnóstico.',
		}
	}

	if (activeAchievement?.key === 'diagnostic') {
		return {
			label: 'Continuar Diagnóstico',
			title: 'Diagnóstico',
			description:
				'Continue sua avaliação estrutural para identificar o pilar crítico e liberar o próximo nível.',
		}
	}

	if (activeAchievement?.key === 'next-level') {
		const isInProgress = cycleStatus === 'phase2_in_progress'
		return {
			label: isInProgress ? 'Continuar Próximo Nível' : 'Iniciar Próximo Nível',
			title: 'Próximo Nível',
			description:
				'Avance para a Avaliação Aprofundada do pilar crítico e refine o seu diagnóstico.',
		}
	}

	if (activeAchievement?.key === 'protocol') {
		return {
			label: 'Continuar Protocolo',
			title: 'Protocolo',
			description:
				'Execute as reflexões e ações do protocolo para concluir este ciclo do CORTEX.',
		}
	}

	if (activeAchievement?.key === 'reevaluation' && temporalRules) {
		return {
			label: 'Iniciar Reavaliação',
			title: 'Reavaliação',
			description: `${phase2ReevaluationDays} dias concluídos desde o protocolo. Refaça sua Avaliação Aprofundada.`,
		}
	}

	if (
		temporalRules?.canStartNewCycle &&
		repurchasePriceLabel &&
		repurchaseCheckoutUrl
	) {
		return {
			label: `Pagar ${repurchasePriceLabel} para refazer`,
			title: 'Refazer CORTEX',
			description: `Seu novo ciclo já pode ser liberado. Conclua o pagamento de ${repurchasePriceLabel} para refazer todo o CORTEX neste nicho.`,
		}
	}

	if (temporalRules?.canStartNewCycle) {
		return {
			label: 'Iniciar Novo Diagnóstico',
			title: 'Novo Diagnóstico',
			description:
				'Novo ciclo liberado. Refaça a Fase 1 para iniciar um diagnóstico completo.',
		}
	}

	if (isCycleCompleted && temporalRules) {
		return {
			label: 'Aguardar Reavaliação',
			title: 'Reavaliação',
			description:
				temporalRules.phase2Reevaluation.message ??
				`Reavaliação disponível em ${phase2ReevaluationDays} dias, após concluir o Protocolo de Ação.`,
		}
	}

	return {
		label: 'Continuar Diagnóstico',
		title: 'Diagnóstico',
		description:
			newCycleDays != null
				? `Siga com a etapa ativa do seu ciclo. Novo diagnóstico estrutural disponível em ${newCycleDays} dias.`
				: 'Retome sua avaliação de onde parou.',
	}
}

export const useDashboardData = () => {
	const { user } = useAuth()
	const nicheAccess = useActiveNicheAccess()
	const profileQuery = useProfileQuery()
	const cycleQuery = useDiagnosticCycleQuery()
	const protocolQuery = useProtocolProgressQuery()
	const comparativeQuery = useComparativeReport()

	const viewModel = useMemo(() => {
		const activeNiche = nicheAccess.activeNiche
		const cycle = cycleQuery.data
		const protocol = protocolQuery.data
		const isAdmin = resolveIsAdmin({
			profileRole: profileQuery.data?.role,
			appMetadataRole: user?.app_metadata?.role,
			userMetadataRole: user?.user_metadata?.role,
			email: user?.email,
		})

		if (!activeNiche) {
			return {
				greetingName: profileQuery.data?.fullName ?? 'Usuário',
				avatarUrl: profileQuery.data?.avatarUrl ?? null,
				isAdmin,
				hasNicheAccess: false,
				activeNicheName: null,
				activeNicheSlug: null,
				availableNiches: nicheAccess.availableNiches,
				hasStartedDiagnostic: false,
				ctaLabel: 'Aguardando Liberação',
				ctaDescription:
					'Sua conta ainda não possui nichos liberados. Conclua a compra para iniciar o diagnóstico.',
				ctaTitle: 'Sem acesso a nichos',
				statusCards: {
					current: 'bloqueada' as const,
					reeval45: 'bloqueada' as const,
					reeval90: 'bloqueada' as const,
				},
				statusCardMessages: {
					reeval45: 'Reavaliação indisponível sem nicho ativo.',
					reeval90: 'Novo diagnóstico indisponível sem nicho ativo.',
				},
				strategicRatio: '0 / 14',
				strategicCompleted: 0,
				strategicTotal: 14,
				nextStep: 'Aguardando liberação de nicho',
				currentBlock: 1,
				pillars: {
					clarity: 0,
					structure: 0,
					execution: 0,
					emotional: 0,
				},
				history: [],
				comparative: comparativeQuery.report,
				repurchaseOffer: null,
				achievements: resolveAchievements({
					hasNicheAccess: false,
					cycle: null,
					canRunReevaluation: false,
				}),
			}
		}

		if (!cycle) {
			const achievements = resolveAchievements({
				hasNicheAccess: true,
				cycle: null,
				canRunReevaluation: false,
			})
			const cta = resolveAchievementCta({
				activeAchievement: getActiveAchievement(achievements),
				cycleStatus: null,
				hasStartedDiagnostic: false,
				phase2ReevaluationDays: activeNiche.phase2ReevaluationDays,
				newCycleDays: activeNiche.newCycleDays,
				isCycleCompleted: false,
			})

			return {
				greetingName: profileQuery.data?.fullName ?? 'Usuário',
				avatarUrl: profileQuery.data?.avatarUrl ?? null,
				isAdmin,
				hasNicheAccess: true,
				activeNicheName: activeNiche.name,
				activeNicheSlug: activeNiche.slug,
				availableNiches: nicheAccess.availableNiches,
				hasStartedDiagnostic: false,
				ctaLabel: cta.label,
				ctaDescription: cta.description,
				ctaTitle: cta.title,
				statusCards: {
					current: 'pendente' as const,
					reeval45: 'bloqueada' as const,
					reeval90: 'bloqueada' as const,
				},
				statusCardMessages: {
					reeval45: `Reavaliação disponível em ${activeNiche.phase2ReevaluationDays} dias, após concluir o Protocolo de Ação.`,
					reeval90: `Novo diagnóstico estrutural disponível em ${activeNiche.newCycleDays} dias.`,
				},
				strategicRatio: protocol?.strategicProgress.ratioLabel ?? '0 / 14',
				strategicCompleted: protocol?.strategicProgress.completedActions ?? 0,
				strategicTotal: protocol?.strategicProgress.totalActions ?? 14,
				nextStep: protocol?.nextStep ?? 'Iniciar avaliação inicial',
				currentBlock: protocol?.model.currentBlock ?? 1,
				pillars: {
					clarity: 0,
					structure: 0,
					execution: 0,
					emotional: 0,
				},
				history: comparativeQuery.data ?? [],
				comparative: comparativeQuery.report,
				repurchaseOffer: null,
				achievements,
			}
		}

		const temporalRules = computeDiagnosticTemporalRules({
			phase1CompletedAt: cycle.timeline.phase1CompletedAt,
			protocolCompletedAt: cycle.timeline.protocolCompletedAt,
			reeval45CompletedAt: cycle.timeline.reeval45CompletedAt,
			phase2ReevaluationDays: activeNiche.phase2ReevaluationDays,
			newStructuralDiagnosisDays: activeNiche.newCycleDays,
		})
		const isCycleCompleted = Boolean(cycle.timeline.protocolCompletedAt)
		const achievements = resolveAchievements({
			hasNicheAccess: true,
			cycle,
			canRunReevaluation: temporalRules.canRunPhase2Reevaluation,
		})
		const repurchasePriceLabel =
			activeNiche.repurchasePriceCents == null
				? null
				: new Intl.NumberFormat('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					}).format(activeNiche.repurchasePriceCents / 100)
		const cta = resolveAchievementCta({
			activeAchievement: getActiveAchievement(achievements),
			cycleStatus: cycle.status,
			hasStartedDiagnostic: true,
			phase2ReevaluationDays: activeNiche.phase2ReevaluationDays,
			newCycleDays: activeNiche.newCycleDays,
			temporalRules,
			isCycleCompleted,
			repurchasePriceLabel,
			repurchaseCheckoutUrl: activeNiche.repurchaseCheckoutUrl,
		})

		return {
			greetingName: profileQuery.data?.fullName ?? 'Usuário',
			avatarUrl: profileQuery.data?.avatarUrl ?? null,
			isAdmin,
			hasNicheAccess: true,
			activeNicheName: activeNiche.name,
			activeNicheSlug: activeNiche.slug,
			availableNiches: nicheAccess.availableNiches,
			hasStartedDiagnostic: true,
			ctaLabel: cta.label,
			ctaTitle: cta.title,
			ctaDescription: cta.description,
			statusCards: {
				current: cycle.timeline.protocolCompletedAt ? 'concluida' : 'pendente',
				reeval45: cycle.timeline.reeval45CompletedAt
					? 'concluida'
					: temporalRules.phase2Reevaluation.isLocked
						? 'bloqueada'
						: 'liberada',
				reeval90: cycle.timeline.reeval90CompletedAt
					? 'concluida'
					: temporalRules.newStructuralDiagnosis.isLocked
						? 'bloqueada'
						: 'liberada',
			},
			statusCardMessages: {
				reeval45: cycle.timeline.reeval45CompletedAt
					? 'Reavaliação concluída.'
					: temporalRules.phase2Reevaluation.message,
				reeval90: cycle.timeline.reeval90CompletedAt
					? 'Novo ciclo já iniciado.'
					: temporalRules.newStructuralDiagnosis.message,
			},
			strategicRatio: protocol?.strategicProgress.ratioLabel ?? '0 / 14',
			strategicCompleted: protocol?.strategicProgress.completedActions ?? 0,
			strategicTotal: protocol?.strategicProgress.totalActions ?? 14,
			nextStep: protocol?.nextStep ?? 'Continuar protocolo adaptativo',
			currentBlock: protocol?.model.currentBlock ?? 1,
			pillars: cycle.pillars,
			history: comparativeQuery.data ?? [],
			comparative: comparativeQuery.report,
			repurchaseOffer:
				temporalRules.canStartNewCycle &&
				activeNiche.repurchasePriceCents != null
					? {
							priceLabel: repurchasePriceLabel,
							checkoutUrl: activeNiche.repurchaseCheckoutUrl,
						}
					: null,
			achievements,
		}
	}, [
		comparativeQuery.data,
		comparativeQuery.report,
		cycleQuery.data,
		nicheAccess.activeNiche,
		nicheAccess.availableNiches,
		profileQuery.data?.avatarUrl,
		profileQuery.data?.fullName,
		profileQuery.data?.role,
		protocolQuery.data,
		user?.app_metadata?.role,
		user?.email,
		user?.user_metadata?.role,
	])

	return {
		isLoading:
			nicheAccess.isLoading ||
			profileQuery.isLoading ||
			cycleQuery.isLoading ||
			protocolQuery.isLoading ||
			comparativeQuery.isLoading,
		viewModel,
	}
}
