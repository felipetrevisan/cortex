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
	getBlueprintPhase2Questions,
	useDiagnosticBlueprintQuery,
} from '@/features/diagnostic/hooks/use-diagnostic-blueprint-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { ResultPhaseSlug } from '../lib/result-routes'

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

interface StructuralInsight {
	id: 'asymmetry' | 'risk' | 'coherence'
	title: string
	status: string
	valueLabel: string
	description: string
}

interface Phase1FinalSummary {
	scenario: 'green' | 'yellow' | 'red'
	title: string
	description: string
}

const getAsymmetryScore = (values: number[]): number =>
	Math.max(...values) - Math.min(...values)

const getAsymmetryInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const highest = Math.max(...values)
	const lowest = Math.min(...values)
	const asymmetry = highest - lowest

	if (asymmetry <= 15) {
		return {
			status: 'Estrutura Coesa',
			valueLabel: `${asymmetry} pontos`,
			description:
				'Os pilares apresentam baixa dispersão estrutural. Isso indica integração funcional entre os componentes, com distribuição equilibrada de força. A tendência é estabilidade operacional, com menor necessidade de compensação entre áreas.',
		}
	}

	if (asymmetry <= 30) {
		return {
			status: 'Leve Assimetria',
			valueLabel: `${asymmetry} pontos`,
			description:
				'Há variação mensurável entre pilares, ainda dentro de zona funcional. O arranjo opera com leve desbalanceamento, exigindo ajustes pontuais para preservar consistência.',
		}
	}

	if (asymmetry <= 50) {
		return {
			status: 'Assimetria Moderada',
			valueLabel: `${asymmetry} pontos`,
			description:
				'A diferença entre os pilares é significativa. O funcionamento ocorre por meio de compensações internas, e não por integração plena. Esse padrão eleva o custo operacional e reduz eficiência global.',
		}
	}

	return {
		status: 'Alta Assimetria',
		valueLabel: `${asymmetry} pontos`,
		description:
			'A dispersão entre pilares é elevada. As áreas operam em níveis substancialmente distintos, caracterizando desequilíbrio sistêmico. Esse padrão compromete previsibilidade e favorece ciclos recorrentes de instabilidade.',
	}
}

const getOperationalRiskInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const lowest = Math.min(...values)
	const asymmetry = Math.max(...values) - lowest

	if (lowest >= 60 && asymmetry <= 30) {
		return {
			status: 'Risco Baixo',
			valueLabel: `Base mínima ${lowest}%`,
			description:
				'O arranjo atual sustenta funcionamento estável. A probabilidade de ruptura de desempenho é reduzida, salvo sob estresse externo significativo.',
		}
	}

	if (lowest >= 40 && asymmetry <= 50) {
		return {
			status: 'Risco Moderado',
			valueLabel: `Base mínima ${lowest}%`,
			description:
				'Há vulnerabilidade identificável. Sob aumento de exigência ou pressão contextual, tende a ocorrer oscilação mensurável de desempenho.',
		}
	}

	return {
		status: 'Risco Alto',
		valueLabel: `Base mínima ${lowest}%`,
		description:
			'A configuração apresenta fragilidade relevante. A combinação entre baixa base funcional e alta dispersão amplia o risco de inconsistência recorrente e perda de previsibilidade.',
	}
}

const getCoherenceInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const average = values.reduce((sum, value) => sum + value, 0) / values.length
	const meanDeviation =
		values.reduce((sum, value) => sum + Math.abs(value - average), 0) /
		values.length
	const roundedDeviation = Math.round(meanDeviation)

	if (meanDeviation <= 10) {
		return {
			status: 'Alta Coerência',
			valueLabel: `Desvio médio ${roundedDeviation}`,
			description:
				'Há alinhamento interno consistente. Os pilares operam de forma interdependente, favorecendo eficiência e estabilidade.',
		}
	}

	if (meanDeviation <= 20) {
		return {
			status: 'Coerência Moderada',
			valueLabel: `Desvio médio ${roundedDeviation}`,
			description:
				'O alinhamento é parcial. Embora exista integração funcional, a variação entre áreas exige compensação contínua para manutenção de desempenho.',
		}
	}

	return {
		status: 'Estrutura Fragmentada',
		valueLabel: `Desvio médio ${roundedDeviation}`,
		description:
			'Observa-se fragmentação estrutural. As áreas não convergem em intensidade funcional, aumentando fricção interna e elevando o esforço necessário para sustentar consistência.',
	}
}

const getPillarTextLabel = (pillar: PillarKey | null): string => {
	switch (pillar) {
		case 'clarity':
			return 'direção'
		case 'structure':
			return 'organização'
		case 'execution':
			return 'constância'
		case 'emotional':
			return 'equilíbrio emocional'
		default:
			return 'organização'
	}
}

const getPhase1FinalSummary = (input: {
	strongPillar: PillarKey | null
	criticalPillar: PillarKey | null
	riskStatus: string
	asymmetry: number
}): Phase1FinalSummary => {
	const strong = getPillarTextLabel(input.strongPillar)
	const weak = getPillarTextLabel(input.criticalPillar)

	if (input.riskStatus === 'Risco Alto' || input.asymmetry > 50) {
		return {
			scenario: 'red',
			title: 'Cenário — Ciclo de Instabilidade Estrutural',
			description: `O desempenho atual está sendo limitado por ${weak}, mesmo havendo força relevante em ${strong}. A diferença entre essas áreas gera desequilíbrio, dificultando consistência e manutenção de resultados.\n\nSe o padrão permanecer inalterado, a tendência é repetição de ciclos de esforço intenso seguidos de instabilidade. A prioridade estratégica é estabilizar ${weak}, permitindo que a força existente em ${strong} deixe de compensar fragilidades e passe a sustentar crescimento estruturado.`,
		}
	}

	if (input.riskStatus === 'Risco Moderado' || input.asymmetry > 30) {
		return {
			scenario: 'yellow',
			title: 'Cenário — Desequilíbrio Controlável',
			description: `Existe capacidade instalada, principalmente em ${strong}, mas o desempenho depende de compensações causadas pela fragilidade em ${weak}. Isso gera esforço adicional e oscilação em momentos de maior exigência.\n\nSem intervenção direcionada, o padrão tende a se repetir: avanço sustentado por esforço seguido de perda de ritmo. O foco estratégico está em fortalecer ${weak} para reduzir a necessidade de compensação e permitir que ${strong} opere como alavanca real de crescimento.`,
		}
	}

	return {
		scenario: 'green',
		title: 'Cenário — Estabilidade com Potencial de Evolução',
		description: `Seu sistema apresenta uma base consistente, com destaque para ${strong}. Existe equilíbrio geral entre as áreas, e o ponto que mais pede atenção é ${weak}. Esse ajuste não representa fragilidade estrutural, mas uma oportunidade clara de refinamento.\n\nSe mantido como está, o funcionamento tende a continuar estável, porém abaixo do potencial máximo. Trabalhar especificamente ${weak} permitirá que a força já existente em ${strong} sustente um novo nível de desempenho, com menos esforço e maior previsibilidade.`,
	}
}

const buildStructuralInsights = (input: {
	pillars: Record<PillarKey, number>
}): StructuralInsight[] => {
	const values = PILLARS.map((pillar) => input.pillars[pillar.key])
	const asymmetry = getAsymmetryInsight(values)
	const risk = getOperationalRiskInsight(values)
	const coherence = getCoherenceInsight(values)

	return [
		{
			id: 'asymmetry',
			title: 'Índice de Assimetria Estrutural',
			...asymmetry,
		},
		{
			id: 'risk',
			title: 'Nível de Risco Operacional',
			...risk,
		},
		{
			id: 'coherence',
			title: 'Coerência Interna do Sistema',
			...coherence,
		},
	]
}

const getPhase1OverviewText = (input: {
	generalIndex: number
	criticalPillar: PillarKey | null
	strongPillar: PillarKey | null
}): string => {
	if (!input.criticalPillar || !input.strongPillar) {
		return 'O diagnóstico estrutural ainda exige leitura complementar para consolidar o contraste entre força e vulnerabilidade.'
	}

	const maturity = classifyMaturity(input.generalIndex)

	if (maturity.level === 'critico') {
		return `O projeto apresenta condição estrutural crítica. ${pillarTitle(input.criticalPillar)} é hoje o principal gargalo, enquanto ${pillarTitle(input.strongPillar)} sustenta a base mais estável.`
	}

	if (maturity.level === 'instavel') {
		return `A estrutura atual está instável. ${pillarTitle(input.criticalPillar)} precisa de reforço para que ${pillarTitle(input.strongPillar)} consiga sustentar avanço consistente.`
	}

	if (maturity.level === 'funcional') {
		return `A base estrutural já é funcional. ${pillarTitle(input.strongPillar)} ajuda a manter o avanço, mas ${pillarTitle(input.criticalPillar)} ainda precisa de ajustes para ganhar previsibilidade.`
	}

	return `A base estrutural está sólida. ${pillarTitle(input.strongPillar)} opera como vantagem clara, enquanto ${pillarTitle(input.criticalPillar)} concentra apenas ajustes finos para ampliar previsibilidade e conclusão.`
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

	const maturity = classifyMaturity(input.generalIndex)

	if (maturity.level === 'critico') {
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
	}>
	donutSegments: Array<{
		label: string
		value: number
		colorToken: string
	}>
	structuralInsights: StructuralInsight[]
	finalSummary: Phase1FinalSummary
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
}): Phase1DetailedResult => {
	const pillarItems = PILLARS.map((pillar) => ({
		key: pillar.key,
		title: pillar.title,
		value: input.cycle.pillars[pillar.key],
		colorToken: pillar.colorToken,
		summary: getMaturitySummaryText(input.cycle.pillars[pillar.key]),
	}))

	const criticalPillar = isPillarKey(input.cycle.highlights.critical)
		? input.cycle.highlights.critical
		: null
	const strongPillar = isPillarKey(input.cycle.highlights.strong)
		? input.cycle.highlights.strong
		: null
	const asymmetry = getAsymmetryScore(
		PILLARS.map((pillar) => input.cycle.pillars[pillar.key]),
	)
	const riskStatus = getOperationalRiskInsight(
		PILLARS.map((pillar) => input.cycle.pillars[pillar.key]),
	).status

	return {
		kind: 'phase1',
		completedAt: input.cycle.timeline.phase1CompletedAt,
		generalIndex: input.cycle.indexes.general,
		criticalPillar,
		strongPillar,
		overviewText: getPhase1OverviewText({
			generalIndex: input.cycle.indexes.general,
			criticalPillar,
			strongPillar,
		}),
		pillarItems,
		donutSegments: pillarItems.map((item) => ({
			label: item.title,
			value: item.value,
			colorToken: item.colorToken,
		})),
		structuralInsights: buildStructuralInsights({
			pillars: input.cycle.pillars,
		}),
		finalSummary: getPhase1FinalSummary({
			strongPillar,
			criticalPillar,
			riskStatus,
			asymmetry,
		}),
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
					.from('phase2_responses')
					.select('question_type, question_number, score')
					.eq('cycle_id', cycleId)
					.eq('user_id', user.id)
					.eq('niche_id', activeNiche.nicheId)
					.order('question_number', { ascending: true }),
			])

			if (cycleError) throw new Error(cycleError.message)
			if (phase2Error) throw new Error(phase2Error.message)

			const cycle = mapDiagnosticCycle(cycleRow)

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
					}),
				}
			}

			const criticalPillar = isPillarKey(cycle.highlights.critical)
				? cycle.highlights.critical
				: null
			const phase2Questions = criticalPillar
				? getBlueprintPhase2Questions(blueprintQuery.data, criticalPillar)
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
