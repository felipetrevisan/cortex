import type { PillarKey } from '../constants/pillars'

export const PHASE_SCORE_MIN = 1
export const PHASE_SCORE_MAX = 6

export type MaturityLevel = 'critico' | 'atencao' | 'consistente' | 'forte'

export interface MaturityClassification {
	level: MaturityLevel
	label: string
	description: string
}

export interface Phase1Summary {
	pillarPercentages: Record<PillarKey, number>
	generalIndex: number
	criticalCandidates: PillarKey[]
	strongCandidates: PillarKey[]
	criticalPillar: PillarKey | null
	strongPillar: PillarKey | null
	hasTieBreak: boolean
}

export interface Phase2Summary {
	technicalIndex: number
	stateIndex: number
	generalIndex: number
}

export interface CriticalPointInput {
	id: string
	questionType: 'technical' | 'state'
	questionNumber: number
	score: number
	title: string
	pillar?: PillarKey
}

export interface CriticalPoint {
	id: string
	questionType: 'technical' | 'state'
	questionNumber: number
	score: number
	title: string
	pillar?: PillarKey
	diagnosis: string
}

const toPercent = (scores: number[]): number => {
	if (scores.length === 0) return 0
	const average =
		scores.reduce((total, score) => total + score, 0) / scores.length
	return Math.round((average / PHASE_SCORE_MAX) * 100)
}

const resolveCandidates = (
	entries: Array<[PillarKey, number]>,
	type: 'min' | 'max',
): PillarKey[] => {
	if (entries.length === 0) return []

	const target =
		type === 'min'
			? Math.min(...entries.map((entry) => entry[1]))
			: Math.max(...entries.map((entry) => entry[1]))
	return entries.filter((entry) => entry[1] === target).map((entry) => entry[0])
}

export const classifyMaturity = (percent: number): MaturityClassification => {
	if (percent <= 40) {
		return {
			level: 'critico',
			label: 'Crítico',
			description:
				'Exige intervenção imediata para evitar bloqueios de conclusão.',
		}
	}

	if (percent <= 60) {
		return {
			level: 'atencao',
			label: 'Atenção',
			description: 'Há fragilidade relevante. Priorize ajustes estruturais.',
		}
	}

	if (percent <= 80) {
		return {
			level: 'consistente',
			label: 'Consistente',
			description: 'Base funcional. Foque em consistência para ganhar tração.',
		}
	}

	return {
		level: 'forte',
		label: 'Forte',
		description: 'Pilar maduro com boa capacidade de sustentação.',
	}
}

export const computePhase1Summary = (
	pillarScores: Record<PillarKey, number[]>,
	manualCriticalPillar: PillarKey | null = null,
	manualStrongPillar: PillarKey | null = null,
): Phase1Summary => {
	const percentages: Record<PillarKey, number> = {
		clarity: toPercent(pillarScores.clarity),
		structure: toPercent(pillarScores.structure),
		execution: toPercent(pillarScores.execution),
		emotional: toPercent(pillarScores.emotional),
	}

	const entries = Object.entries(percentages) as Array<[PillarKey, number]>
	const criticalCandidates = resolveCandidates(entries, 'min')
	const strongCandidates = resolveCandidates(entries, 'max')

	const criticalPillar =
		criticalCandidates.length === 1
			? (criticalCandidates[0] ?? null)
			: manualCriticalPillar &&
					criticalCandidates.includes(manualCriticalPillar)
				? manualCriticalPillar
				: null

	const strongPillar =
		strongCandidates.length === 1
			? (strongCandidates[0] ?? null)
			: manualStrongPillar && strongCandidates.includes(manualStrongPillar)
				? manualStrongPillar
				: null

	const generalIndex = Math.round(
		(percentages.clarity +
			percentages.structure +
			percentages.execution +
			percentages.emotional) /
			4,
	)

	return {
		pillarPercentages: percentages,
		generalIndex,
		criticalCandidates,
		strongCandidates,
		criticalPillar,
		strongPillar,
		hasTieBreak: !criticalPillar || !strongPillar,
	}
}

export const computePhase2Summary = (
	technicalScores: number[],
	stateScores: number[],
): Phase2Summary => {
	const technicalIndex = toPercent(technicalScores)
	const stateIndex = toPercent(stateScores)
	const generalIndex = Math.round((technicalIndex + stateIndex) / 2)

	return {
		technicalIndex,
		stateIndex,
		generalIndex,
	}
}

const toDiagnosisText = (input: CriticalPointInput): string => {
	const severity = input.score <= 1 ? 'alto' : 'moderado'

	if (input.questionType === 'technical') {
		return `Risco ${severity} no eixo técnico. Este ponto compromete previsibilidade, priorização e entrega até a conclusão.`
	}

	return `Risco ${severity} no estado atual. O padrão emocional/operacional reduz consistência e aumenta chance de interrupção.`
}

export const getCriticalPoints = (
	items: CriticalPointInput[],
): CriticalPoint[] =>
	items
		.filter((item) => item.score <= 2)
		.map((item) => ({
			...item,
			diagnosis: toDiagnosisText(item),
		}))
		.sort((a, b) => a.score - b.score || a.questionNumber - b.questionNumber)
