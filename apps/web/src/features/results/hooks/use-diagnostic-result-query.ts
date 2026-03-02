'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import { PILLARS } from '@cortex/shared/constants/pillars'
import {
	classifyMaturity,
	getCriticalPoints,
} from '@cortex/shared/domain/diagnostic-calculations'
import { mapDiagnosticCycle } from '@cortex/shared/models/diagnostic-cycle.model'
import type { Tables } from '@cortex/shared/supabase/database.types'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import {
	type DiagnosticPhase2QuestionBlueprint,
	useDiagnosticBlueprintQuery,
} from '@/features/diagnostic/hooks/use-diagnostic-blueprint-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { ResultPhaseSlug } from '../lib/result-routes'

type Phase1ResponseRow = Pick<
	Tables<'phase1_responses'>,
	'pillar' | 'question_number' | 'score'
>

type Phase2ResponseRow = Pick<
	Tables<'phase2_responses'>,
	'question_type' | 'question_number' | 'score'
>

const isPillarKey = (value: string | null): value is PillarKey =>
	value === 'clarity' ||
	value === 'structure' ||
	value === 'execution' ||
	value === 'emotional'

const pillarTitle = (pillar: PillarKey | null): string =>
	PILLARS.find((item) => item.key === pillar)?.title ?? '-'

const getMaturitySummaryText = (value: number): string => {
	const maturity = classifyMaturity(value)
	return `${maturity.label}: ${maturity.description}`
}

const getPhase1OverviewText = (input: {
	generalIndex: number
	criticalPillar: PillarKey | null
	strongPillar: PillarKey | null
}): string => {
	if (!input.criticalPillar || !input.strongPillar) {
		return 'O diagnóstico estrutural ainda exige leitura complementar para consolidar o contraste entre força e vulnerabilidade.'
	}

	if (input.generalIndex <= 40) {
		return `O projeto apresenta risco estrutural elevado. ${pillarTitle(input.criticalPillar)} é hoje o principal gargalo, enquanto ${pillarTitle(input.strongPillar)} sustenta a base mais estável.`
	}

	if (input.generalIndex <= 70) {
		return `A estrutura atual é funcional, mas instável. ${pillarTitle(input.criticalPillar)} precisa de reforço para que ${pillarTitle(input.strongPillar)} consiga sustentar avanço consistente.`
	}

	return `A base estrutural está sólida. ${pillarTitle(input.strongPillar)} opera como vantagem clara, enquanto ${pillarTitle(input.criticalPillar)} concentra os ajustes finos para ampliar previsibilidade e conclusão.`
}

const getPhase2OverviewText = (input: {
	generalIndex: number
	technicalIndex: number
	stateIndex: number
	criticalPillar: PillarKey | null
	criticalPointsCount: number
}): string => {
	const pillar = pillarTitle(input.criticalPillar)

	if (input.criticalPointsCount === 0) {
		return `A leitura aprofundada de ${pillar} não identificou pontos críticos imediatos. O foco agora é transformar consistência em ritmo de execução.`
	}

	if (input.generalIndex <= 40) {
		return `${pillar} segue com risco refinado elevado. Há ${input.criticalPointsCount} ponto(s) crítico(s) comprometendo a capacidade de concluir com estabilidade.`
	}

	if (input.technicalIndex < input.stateIndex) {
		return `${pillar} concentra gargalos mais técnicos do que emocionais/operacionais. A estrutura de método precisa ser ajustada antes de escalar.`
	}

	if (input.stateIndex < input.technicalIndex) {
		return `${pillar} sofre mais pela condição atual do que pelo método. Energia, foco e estabilidade estão reduzindo consistência de aplicação.`
	}

	return `${pillar} apresenta fragilidade equilibrada entre método e estado atual. O plano corretivo deve atacar os dois eixos em paralelo.`
}

const buildDonutBackground = (
	segments: Array<{ value: number; color: string }>,
): string => {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0)
	if (total <= 0) {
		return 'conic-gradient(color-mix(in oklch, var(--border) 80%, transparent) 0deg 360deg)'
	}

	let cursor = 0
	const parts = segments.map((segment) => {
		const angle = (segment.value / total) * 360
		const start = cursor
		const end = cursor + angle
		cursor = end
		return `${segment.color} ${start}deg ${end}deg`
	})

	return `conic-gradient(${parts.join(', ')})`
}

interface Phase1DetailedResult {
	kind: 'phase1'
	completedAt: Date | null
	generalIndex: number
	criticalPillar: PillarKey | null
	strongPillar: PillarKey | null
	overviewText: string
	pillarItems: Array<{
		key: PillarKey
		title: string
		value: number
		colorToken: string
		summary: string
		questionCount: number
	}>
	answerDistribution: Array<{
		value: number
		total: number
	}>
	donutSegments: Array<{
		label: string
		value: number
		colorToken: string
	}>
}

interface Phase2DetailedResult {
	kind: 'phase2'
	completedAt: Date | null
	generalIndex: number
	technicalIndex: number
	stateIndex: number
	criticalPillar: PillarKey | null
	overviewText: string
	criticalPoints: ReturnType<typeof getCriticalPoints>
	metrics: Array<{
		label: string
		value: number
		colorToken: string
		description: string
	}>
	donutSegments: Array<{
		label: string
		value: number
		colorToken: string
	}>
}

export interface DiagnosticResultViewModel {
	cycleId: string
	cycleNumber: number
	nicheName: string
	phase: ResultPhaseSlug
	phaseLabel: string
	completedAt: Date | null
	result: Phase1DetailedResult | Phase2DetailedResult
}

const buildPhase1Result = (input: {
	cycle: ReturnType<typeof mapDiagnosticCycle>
	phase1Rows: Phase1ResponseRow[]
	phase1QuestionCountByPillar: Map<PillarKey, number>
}): Phase1DetailedResult => {
	const answerDistribution = [1, 2, 3, 4, 5, 6].map((value) => ({
		value,
		total: input.phase1Rows.filter((row) => row.score === value).length,
	}))

	const pillarItems = PILLARS.map((pillar) => ({
		key: pillar.key,
		title: pillar.title,
		value: input.cycle.pillars[pillar.key],
		colorToken: pillar.colorToken,
		summary: getMaturitySummaryText(input.cycle.pillars[pillar.key]),
		questionCount: input.phase1QuestionCountByPillar.get(pillar.key) ?? 0,
	}))

	return {
		kind: 'phase1',
		completedAt: input.cycle.timeline.phase1CompletedAt,
		generalIndex: input.cycle.indexes.general,
		criticalPillar: isPillarKey(input.cycle.highlights.critical)
			? input.cycle.highlights.critical
			: null,
		strongPillar: isPillarKey(input.cycle.highlights.strong)
			? input.cycle.highlights.strong
			: null,
		overviewText: getPhase1OverviewText({
			generalIndex: input.cycle.indexes.general,
			criticalPillar: isPillarKey(input.cycle.highlights.critical)
				? input.cycle.highlights.critical
				: null,
			strongPillar: isPillarKey(input.cycle.highlights.strong)
				? input.cycle.highlights.strong
				: null,
		}),
		pillarItems,
		answerDistribution,
		donutSegments: pillarItems.map((item) => ({
			label: item.title,
			value: item.value,
			colorToken: item.colorToken,
		})),
	}
}

const buildPhase2Result = (input: {
	cycle: ReturnType<typeof mapDiagnosticCycle>
	phase2Rows: Phase2ResponseRow[]
	phase2Questions: DiagnosticPhase2QuestionBlueprint[]
}): Phase2DetailedResult => {
	const criticalPillar = isPillarKey(input.cycle.highlights.critical)
		? input.cycle.highlights.critical
		: null

	const questionByKey = new Map(
		input.phase2Questions.map((question) => [
			`${question.questionType === 'technical' ? `technical:${criticalPillar}` : 'state:general'}:${question.questionNumber}`,
			question,
		]),
	)

	const criticalPointsInput = input.phase2Rows.map((row) => {
		const lookupKey = `${row.question_type}:${row.question_number}`
		const question = questionByKey.get(lookupKey)

		return {
			id: lookupKey,
			questionType: row.question_type.startsWith('technical')
				? ('technical' as const)
				: ('state' as const),
			questionNumber: row.question_number,
			score: row.score,
			title:
				question?.title ??
				`${row.question_type.startsWith('technical') ? 'Diagnóstico técnico' : 'Estado atual'} ${row.question_number}`,
			...(criticalPillar ? { pillar: criticalPillar } : {}),
		}
	})

	const criticalPoints = getCriticalPoints(criticalPointsInput)

	return {
		kind: 'phase2',
		completedAt: input.cycle.timeline.phase2CompletedAt,
		generalIndex: input.cycle.indexes.phase2General,
		technicalIndex: input.cycle.indexes.phase2Technical,
		stateIndex: input.cycle.indexes.phase2State,
		criticalPillar,
		overviewText: getPhase2OverviewText({
			generalIndex: input.cycle.indexes.phase2General,
			technicalIndex: input.cycle.indexes.phase2Technical,
			stateIndex: input.cycle.indexes.phase2State,
			criticalPillar,
			criticalPointsCount: criticalPoints.length,
		}),
		criticalPoints,
		metrics: [
			{
				label: 'Índice técnico',
				value: input.cycle.indexes.phase2Technical,
				colorToken: 'primary',
				description: 'Mostra a robustez do método aplicado ao pilar crítico.',
			},
			{
				label: 'Estado atual',
				value: input.cycle.indexes.phase2State,
				colorToken: 'accent',
				description:
					'Mostra o quanto energia, foco e estabilidade ajudam ou travam a execução.',
			},
			{
				label: 'Índice geral refinado',
				value: input.cycle.indexes.phase2General,
				colorToken: 'tertiary',
				description:
					'Consolida a leitura técnica com a condição atual do usuário.',
			},
		],
		donutSegments: [
			{
				label: 'Técnico',
				value: input.cycle.indexes.phase2Technical,
				colorToken: 'primary',
			},
			{
				label: 'Estado atual',
				value: input.cycle.indexes.phase2State,
				colorToken: 'accent',
			},
		],
	}
}

export const useDiagnosticResultQuery = (
	cycleId: string,
	phase: ResultPhaseSlug,
) => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()
	const blueprintQuery = useDiagnosticBlueprintQuery()

	return useQuery({
		queryKey: [
			'diagnostic-result',
			user?.id ?? 'anon',
			activeNiche?.nicheId ?? 'no-niche',
			cycleId,
			phase,
		],
		enabled: Boolean(user?.id && activeNiche?.nicheId && cycleId),
		queryFn: async (): Promise<DiagnosticResultViewModel> => {
			if (!user?.id || !activeNiche?.nicheId) {
				throw new Error('Usuário não autenticado')
			}

			const supabase = getSupabaseClient()

			const [
				{ data: cycleRow, error: cycleError },
				{ data: phase1Rows, error: phase1Error },
				{ data: phase2Rows, error: phase2Error },
			] = await Promise.all([
				supabase
					.from('diagnostic_cycles')
					.select('*')
					.eq('id', cycleId)
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId)
					.single(),
				supabase
					.from('phase1_responses')
					.select('pillar, question_number, score')
					.eq('cycle_id', cycleId)
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId)
					.order('question_number', { ascending: true }),
				supabase
					.from('phase2_responses')
					.select('question_type, question_number, score')
					.eq('cycle_id', cycleId)
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId)
					.order('question_number', { ascending: true }),
			])

			if (cycleError) throw new Error(cycleError.message)
			if (phase1Error) throw new Error(phase1Error.message)
			if (phase2Error) throw new Error(phase2Error.message)

			const cycle = mapDiagnosticCycle(cycleRow)
			const phase1QuestionCountByPillar = new Map<PillarKey, number>(
				PILLARS.map((pillar) => [
					pillar.key,
					blueprintQuery.data?.phase1Pillars.find(
						(item) => item.pillar === pillar.key,
					)?.questions.length ?? 0,
				]),
			)

			if (phase === 'phase-1') {
				return {
					cycleId: cycle.id,
					cycleNumber: cycle.cycleNumber,
					nicheName: activeNiche.name,
					phase,
					phaseLabel: 'Fase 1',
					completedAt: cycle.timeline.phase1CompletedAt,
					result: buildPhase1Result({
						cycle,
						phase1Rows: (phase1Rows ?? []) as Phase1ResponseRow[],
						phase1QuestionCountByPillar,
					}),
				}
			}

			const criticalPillar = isPillarKey(cycle.highlights.critical)
				? cycle.highlights.critical
				: null
			const phase2Questions = criticalPillar
				? (blueprintQuery.data?.getPhase2Questions(criticalPillar) ?? [])
				: []

			return {
				cycleId: cycle.id,
				cycleNumber: cycle.cycleNumber,
				nicheName: activeNiche.name,
				phase,
				phaseLabel: 'Fase 2',
				completedAt: cycle.timeline.phase2CompletedAt,
				result: buildPhase2Result({
					cycle,
					phase2Rows: (phase2Rows ?? []) as Phase2ResponseRow[],
					phase2Questions,
				}),
			}
		},
	})
}

export { buildDonutBackground, pillarTitle }
