import type { PillarKey } from '../constants/pillars'

export const PHASE_SCORE_MIN = 1
export const PHASE_SCORE_MAX = 6

export type MaturityLevel = 'critico' | 'instavel' | 'funcional' | 'solido'

export interface MaturityClassification {
	level: MaturityLevel
	label: string
	description: string
}

export interface GeneralStructureClassification {
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

export interface Phase2RefinedClassification {
	level: MaturityLevel
	label: string
}

export type Phase2DominantVariable =
	| 'both'
	| 'state_condition'
	| 'technical_method'

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
	const value = Math.max(0, Math.min(100, percent))

	if (value <= 39) {
		return {
			level: 'critico',
			label: 'Crítico',
			description:
				'Exige intervenção imediata para evitar bloqueios de conclusão.',
		}
	}

	if (value <= 59) {
		return {
			level: 'instavel',
			label: 'Instável',
			description:
				'Há fragilidade relevante. O avanço existe, mas ainda oscila com facilidade.',
		}
	}

	if (value <= 79) {
		return {
			level: 'funcional',
			label: 'Funcional',
			description:
				'A base já funciona. O foco agora é consolidar consistência e previsibilidade.',
		}
	}

	return {
		level: 'solido',
		label: 'Sólido',
		description: 'Pilar maduro, estável e com boa capacidade de sustentação.',
	}
}

export const classifyGeneralStructure = (
	percent: number,
): GeneralStructureClassification => {
	const value = Math.max(0, Math.min(100, percent))

	if (value <= 39) {
		return {
			level: 'critico',
			label: 'Estrutura Comprometida',
			description:
				'A estrutura apresenta fragilidades relevantes que limitam desempenho e previsibilidade. Há necessidade de reorganização estratégica para evitar ciclos recorrentes de instabilidade.',
		}
	}

	if (value <= 59) {
		return {
			level: 'instavel',
			label: 'Estrutura Instável',
			description:
				'Existe funcionamento parcial, porém com oscilações frequentes. A base permite avanço, mas ainda depende de esforço excessivo para manter resultados.',
		}
	}

	if (value <= 79) {
		return {
			level: 'funcional',
			label: 'Estrutura Funcional',
			description:
				'A base estrutural já sustenta avanço consistente. Ajustes direcionados podem elevar previsibilidade e reduzir desgaste operacional.',
		}
	}

	return {
		level: 'solido',
		label: 'Estrutura Sólida',
		description:
			'A estrutura opera com alto nível de organização e consistência. O foco passa a ser otimização e expansão estratégica.',
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
	const generalIndex = Math.round(technicalIndex * 0.6 + stateIndex * 0.4)

	return {
		technicalIndex,
		stateIndex,
		generalIndex,
	}
}

export const classifyPhase2Refined = (
	percent: number,
): Phase2RefinedClassification => {
	const value = Math.max(0, Math.min(100, percent))

	if (value <= 35) {
		return {
			level: 'critico',
			label: 'Crítico',
		}
	}

	if (value <= 50) {
		return {
			level: 'instavel',
			label: 'Instável',
		}
	}

	if (value <= 70) {
		return {
			level: 'funcional',
			label: 'Funcional',
		}
	}

	return {
		level: 'solido',
		label: 'Sólido',
	}
}

export const resolvePhase2DominantVariable = (
	technicalIndex: number,
	stateIndex: number,
): Phase2DominantVariable => {
	const difference = Math.abs(technicalIndex - stateIndex)

	if (difference < 10) return 'both'
	if (technicalIndex > stateIndex + 10) return 'state_condition'
	return 'technical_method'
}

export const toPhase2DominantVariableText = (
	dominantVariable: Phase2DominantVariable,
): string => {
	if (dominantVariable === 'both') {
		return 'Tanto método técnico quanto condição atual'
	}

	if (dominantVariable === 'state_condition') {
		return 'Sua condição atual (física, emocional ou ambiental)'
	}

	return 'Seu método técnico'
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
