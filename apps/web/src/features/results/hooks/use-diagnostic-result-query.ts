'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import { PILLARS } from '@cortex/shared/constants/pillars'
import {
	classifyGeneralStructure,
	classifyMaturity,
	classifyPhase2Refined,
	resolvePhase2DominantVariable,
	toPhase2DominantVariableText,
} from '@cortex/shared/domain/diagnostic-calculations'
import { mapDiagnosticCycle } from '@cortex/shared/models/diagnostic-cycle.model'
import type { Tables } from '@cortex/shared/supabase/database.types'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
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
	return classifyGeneralStructure(input.generalIndex).description
}

const getPhase2OverviewText = (input: {
	generalIndex: number
	technicalIndex: number
	stateIndex: number
	criticalPillar: PillarKey | null
}): string => {
	const pillar = pillarTitle(input.criticalPillar)
	const maturity = classifyPhase2Refined(input.generalIndex)
	const dominantVariable = resolvePhase2DominantVariable(
		input.technicalIndex,
		input.stateIndex,
	)
	const variableText = toPhase2DominantVariableText(dominantVariable)

	if (maturity.level === 'critico') {
		return `Seu pilar de ${pillar} apresenta falhas estruturais significativas. ${variableText} está reduzindo drasticamente sua capacidade de conclusão. Recomenda-se intervenção imediata antes de qualquer avanço.`
	}

	if (maturity.level === 'instavel') {
		return `${pillar} opera abaixo do necessário. ${variableText} está comprometendo mais que o esperado. A execução é possível mas altamente vulnerável a interrupções.`
	}

	if (maturity.level === 'funcional') {
		return `Você possui estrutura suficiente em ${pillar} para avançar de forma sustentável. ${variableText} apresenta resistências, mas o sistema opera. Ajustes específicos podem elevar significativamente a performance.`
	}

	if (dominantVariable === 'both') {
		return `Alto desempenho em ${pillar}. Método e condição operam de forma integrada e favorável. Mantenha o ritmo e foque em refinamentos pontuais.`
	}

	return `Alto desempenho em ${pillar}. ${variableText} operam de forma integrada e favorável. Mantenha o ritmo e foque em refinamentos pontuais.`
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

interface Phase2TechnicalPatternDefinition {
	order: 1 | 2 | 3 | 4
	questionNumbers: number[]
	title: string
	description: string
}

const PHASE2_TECHNICAL_PATTERNS: Record<
	PillarKey,
	Phase2TechnicalPatternDefinition[]
> = {
	clarity: [
		{
			order: 1,
			questionNumbers: [1, 2, 5, 6],
			title: 'Padrão 1: Definição vaga',
			description:
				'Você opera sem definição clara do que significa concluir. O sucesso do projeto está nebuloso, o que torna impossível saber quando chegar lá ou se está no caminho certo. A ausência de critérios objetivos gera constante redefinição de expectativas.',
		},
		{
			order: 2,
			questionNumbers: [8, 9, 12, 14],
			title: 'Padrão 2: Desalinhamento estratégico',
			description:
				'Suas decisões diárias não estão conectadas a uma direção maior. Você tem atividade mas não progresso estratégico, prioridades competem entre si sem hierarquia clara, e a ação se desgasta em caminhos que não levam ao objetivo central.',
		},
		{
			order: 3,
			questionNumbers: [3, 4, 10, 13],
			title: 'Padrão 3: Instabilidade de direção',
			description:
				'Você redefine constantemente o que está construindo. O escopo se expande descontroladamente, metas mudam diante de dificuldades, e a estratégia é revisada antes de gerar resultados. Este ciclo de reinício impede acúmulo de progresso real.',
		},
		{
			order: 4,
			questionNumbers: [7, 11],
			title: 'Padrão 4: Confusão e imprecisão operacional',
			description:
				'Você confunde ocupação com produtividade e inicia sem preparo adequado. Movimento constante mascara a ausência de entregas concretas, enquanto a falta de clareza mínima no início gera retrabalho e dúvida ao longo do caminho.',
		},
	],
	structure: [
		{
			order: 1,
			questionNumbers: [1, 2, 3, 9],
			title: 'Padrão 1: Fragmentação operacional',
			description:
				'Você trabalha com informações dispersas e tarefas mal definidas. Metas não se transformam em ações concretas, checklists são inexistentes ou ignorados, e decisões importantes se perdem na memória. A fragmentação gera ansiedade operacional constante.',
		},
		{
			order: 2,
			questionNumbers: [4, 5, 8, 10],
			title: 'Padrão 2: Planejamento deficiente',
			description:
				'Você executa antes de planejar adequadamente. Prazos são estabelecidos sem base realista, obstáculos surgem como surpresas, e o retrabalho se acumula por falta de antecipação. A pressa inicial gera lentidão posterior.',
		},
		{
			order: 3,
			questionNumbers: [6, 7, 11, 12],
			title: 'Padrão 3: Acompanhamento inexistente',
			description:
				'Você não monitora o que está acontecendo. O progresso é desconhecido, ajustes só ocorrem quando já é tarde, e o projeto depende exclusivamente de você estar motivado. A ausência de visibilidade impede correções de rota.',
		},
		{
			order: 4,
			questionNumbers: [13, 14],
			title: 'Padrão 4: Método não replicável',
			description:
				'Você não possui sistema próprio de organização. Cada projeto é reinventado do zero, sem método transferível, e a organização atual não reduz ansiedade. A dependência de soluções improvisadas gera inconsistência entre projetos.',
		},
	],
	execution: [
		{
			order: 1,
			questionNumbers: [1, 10, 12, 13],
			title: 'Padrão 1: Dependência emocional para iniciar',
			description:
				'Você depende de estar motivado para agir. A execução só acontece no "clima" certo, intenções raramente viram ação imediata, e a busca por perfeição impede finalização. Seu progresso é refém de oscilações internas.',
		},
		{
			order: 2,
			questionNumbers: [2, 3, 4, 5],
			title: 'Padrão 2: Gestão de atenção fragilizada',
			description:
				'Você não protege seu tempo de trabalho profundo. Blocos de tempo são inexistentes, multitarefa fragmenta seu esforço, distrações dominam o ambiente, e metas diárias mínimas não são estabelecidas. O foco é intermitente e superficial.',
		},
		{
			order: 3,
			questionNumbers: [6, 8, 9, 14],
			title: 'Padrão 3: Ausência de ritmo',
			description:
				'Você não mantém regularidade na execução. Avaliações de desempenho não ocorrem, ritmo é imprevisível, ciclos longos de paralisação são frequentes, e constância por semanas é inatingível. O projeto avança em picos esporádicos e morre em vales prolongados.',
		},
		{
			order: 4,
			questionNumbers: [7, 11],
			title: 'Padrão 4: Quebra de compromissos',
			description:
				'Você inicia mas não sustenta. Falhas não são corrigidas rapidamente, microcompromissos são quebrados regularmente, e a palavra dada a si mesmo perde valor. A desconfiança interna mina cada nova tentativa de regularidade.',
		},
	],
	emotional: [
		{
			order: 1,
			questionNumbers: [3, 5, 11, 12],
			title: 'Padrão 1: Intolerância à imperfeição',
			description:
				'Você é refém da própria exigência. Imperfeição inicial é inaceitável, erros são dramatizados, comparações destrutivas são constantes, e progresso parcial é ignorado. A busca pelo ideal impede o real.',
		},
		{
			order: 2,
			questionNumbers: [4, 13, 1, 2],
			title: 'Padrão 2: Vulnerabilidade à crítica e exposição',
			description:
				'Você evita exposição por medo de julgamento. Críticas desestabilizam, ansiedade não é regulada, gatilhos emocionais passam despercebidos, e técnicas de controle são inexistentes. O projeto fica escondido para se manter seguro.',
		},
		{
			order: 3,
			questionNumbers: [6, 7, 8, 10],
			title: 'Padrão 3: Recuperação lenta de frustrações',
			description:
				'Você demora para retomar após contratempos. Frustrações paralisam, autossabotagem é invisível, energia mental não é regulada antes de agir, e decisões sob estresse são impulsivas. O tempo de recuperação consome o tempo de execução.',
		},
		{
			order: 4,
			questionNumbers: [9, 14],
			title: 'Padrão 4: Desconforto emocional paralisante',
			description:
				'Você evita ação quando emocionalmente desconfortável. A perspectiva de longo prazo se perde diante de tensões imediatas, e agir com desconforto é impossível. O projeto espera você se sentir bem para continuar.',
		},
	],
}

interface Phase2TechnicalPatternResult {
	id: string
	order: 1 | 2 | 3 | 4
	title: string
	description: string
	lowScoreCount: number
	questionCount: number
	severity: 'baixa' | 'moderada' | 'alta'
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
	technicalPatterns: Phase2TechnicalPatternResult[]
	stateBlocks: Array<{
		id: 'physical' | 'psychological' | 'environmental' | 'social'
		title: string
		value: number
		level: 'critico' | 'moderado' | 'favoravel'
		description: string
	}>
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

const buildPhase2TechnicalPatterns = (input: {
	rows: Phase2ResponseRow[]
	criticalPillar: PillarKey | null
}): Phase2TechnicalPatternResult[] => {
	if (!input.criticalPillar) return []

	const patternDefinitions = PHASE2_TECHNICAL_PATTERNS[input.criticalPillar]
	const scoresByQuestion = new Map<number, number>()

	for (const row of input.rows) {
		if (!row.question_type.startsWith('technical')) continue
		if (row.question_number < 1 || row.question_number > 14) continue
		scoresByQuestion.set(row.question_number, row.score)
	}

	return patternDefinitions
		.map((pattern) => {
			const lowScoreCount = pattern.questionNumbers.reduce((total, number) => {
				const score = scoresByQuestion.get(number)
				if (typeof score !== 'number') return total
				return score <= 2 ? total + 1 : total
			}, 0)
			const questionCount = pattern.questionNumbers.length
			const intensity = questionCount > 0 ? lowScoreCount / questionCount : 0
			const severity: Phase2TechnicalPatternResult['severity'] =
				intensity >= 0.75 ? 'alta' : intensity >= 0.5 ? 'moderada' : 'baixa'

			return {
				id: `${input.criticalPillar}:pattern-${pattern.order}`,
				order: pattern.order,
				title: pattern.title,
				description: pattern.description,
				lowScoreCount,
				questionCount,
				severity,
			}
		})
		.filter((pattern) => pattern.lowScoreCount > 0)
		.sort((a, b) => {
			if (b.lowScoreCount !== a.lowScoreCount) {
				return b.lowScoreCount - a.lowScoreCount
			}
			return a.order - b.order
		})
		.slice(0, 2)
}

const buildPhase2Result = (input: {
	cycle: ReturnType<typeof mapDiagnosticCycle>
	phase2Rows: Phase2ResponseRow[]
}): Phase2DetailedResult => {
	const criticalPillar = isPillarKey(input.cycle.highlights.critical)
		? input.cycle.highlights.critical
		: null
	const technicalPatterns = buildPhase2TechnicalPatterns({
		rows: input.phase2Rows,
		criticalPillar,
	})
	const stateBlocks = buildPhase2StateBlocks(input.phase2Rows)
	const refinedGeneralIndex = Math.round(
		input.cycle.indexes.phase2Technical * 0.6 +
			input.cycle.indexes.phase2State * 0.4,
	)
	const refinedOverview = getPhase2OverviewText({
		generalIndex: refinedGeneralIndex,
		technicalIndex: input.cycle.indexes.phase2Technical,
		stateIndex: input.cycle.indexes.phase2State,
		criticalPillar,
	})

	return {
		kind: 'phase2',
		completedAt: input.cycle.timeline.phase2CompletedAt,
		generalIndex: refinedGeneralIndex,
		technicalIndex: input.cycle.indexes.phase2Technical,
		stateIndex: input.cycle.indexes.phase2State,
		criticalPillar,
		overviewText: refinedOverview,
		technicalPatterns,
		stateBlocks,
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

const getStateBlockLevel = (
	value: number,
): 'critico' | 'moderado' | 'favoravel' => {
	if (value <= 40) return 'critico'
	if (value <= 70) return 'moderado'
	return 'favoravel'
}

const getStateBlockDescription = (
	blockId: 'physical' | 'psychological' | 'environmental' | 'social',
	level: 'critico' | 'moderado' | 'favoravel',
): string => {
	if (blockId === 'physical') {
		if (level === 'critico') {
			return 'Seu corpo está sobrecarregado. Sono, energia, saúde ou alimentação estão comprometidos, o que reduz diretamente sua capacidade de execução. Recuperação física é prioridade antes de avanços no projeto.'
		}
		if (level === 'moderado') {
			return 'Seu corpo responde de forma irregular. Há momentos de disposição misturados a períodos de desgaste. Pequenos ajustes na rotina física podem gerar ganhos significativos de performance.'
		}
		return 'Seu corpo está bem sustentado. Sono, energia e cuidados básicos estão alinhados, criando base física sólida para execução do projeto.'
	}

	if (blockId === 'psychological') {
		if (level === 'critico') {
			return 'Sua mente e emoções estão sob pressão intensa. Clareza, foco ou equilíbrio estão significativamente reduzidos, o que compromete decisões e consistência. Atenção imediata à saúde mental é necessária.'
		}
		if (level === 'moderado') {
			return 'Sua mente opera com flutuações. Momentos de clareza alternam com dispersão ou instabilidade emocional. Estabilizar estes picos é o caminho para previsibilidade.'
		}
		return 'Sua mente está alinhada e emocionalmente estável. Clareza, foco e controle da tensão criam ambiente interno propício para execução.'
	}

	if (blockId === 'environmental') {
		if (level === 'critico') {
			return 'Seu ambiente está trabalhando contra você. Espaço, organização, tempo ou proteção contra interrupções estão severamente comprometidos. Reestruturação do entorno é essencial.'
		}
		if (level === 'moderado') {
			return 'Seu ambiente é funcional mas instável. Há estrutura básica, mas falhas pontuais em espaço, tempo ou isolamento geram atrito constante. Ajustes específicos podem liberar muito potencial.'
		}
		return 'Seu ambiente apoia sua execução. Espaço definido, tempo protegido e organização adequada criam estrutura externa que facilita o avanço.'
	}

	if (level === 'critico') {
		return 'Suas relações e recursos estão gerando pressão excessiva. Finanças, apoio social ou limites com terceiros demandam atenção urgente. Este peso externo está diretamente limitando seu projeto.'
	}
	if (level === 'moderado') {
		return 'Suas relações e recursos são gerenciáveis mas precários. Há estabilidade relativa, mas vulnerabilidade a imprevistos ou demandas de terceiros. Fortalecer reservas e limites é recomendado.'
	}
	return 'Suas relações e recursos estão estáveis. Apoio disponível, finanças sob controle e limites claros criam segurança externa para focar no projeto.'
}

const buildPhase2StateBlocks = (
	rows: Phase2ResponseRow[],
): Array<{
	id: 'physical' | 'psychological' | 'environmental' | 'social'
	title: string
	value: number
	level: 'critico' | 'moderado' | 'favoravel'
	description: string
}> => {
	const scoresByQuestion = new Map<number, number>()

	for (const row of rows) {
		if (!row.question_type.startsWith('state')) continue
		if (row.question_number < 1 || row.question_number > 16) continue
		scoresByQuestion.set(row.question_number, row.score)
	}

	const blockDefinitions = [
		{
			id: 'physical' as const,
			title: 'Físico/Biológico',
			start: 1,
			end: 4,
		},
		{
			id: 'psychological' as const,
			title: 'Psicológico/Cognitivo',
			start: 5,
			end: 8,
		},
		{
			id: 'environmental' as const,
			title: 'Ambiental/Estrutural',
			start: 9,
			end: 12,
		},
		{
			id: 'social' as const,
			title: 'Social/Financeiro',
			start: 13,
			end: 16,
		},
	]

	return blockDefinitions.map((block) => {
		let sum = 0
		for (let question = block.start; question <= block.end; question += 1) {
			sum += scoresByQuestion.get(question) ?? 0
		}

		const value = Math.round((sum / 24) * 100)
		const level = getStateBlockLevel(value)

		return {
			id: block.id,
			title: block.title,
			value,
			level,
			description: getStateBlockDescription(block.id, level),
		}
	})
}

export const useDiagnosticResultQuery = (
	cycleId: string,
	phase: ResultPhaseSlug,
) => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()

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
				}),
			}
		},
	})
}

export { buildDonutBackground, pillarTitle }
