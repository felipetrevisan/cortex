import type { PillarKey } from '../constants/pillars'
import type { DiagnosticCycleModel } from '../models/diagnostic-cycle.model'

export interface ComparativeMetric {
	key: string
	label: string
	current: number
	previous: number | null
	variation: number | null
	interpretation: string
	trend: 'up' | 'down' | 'flat'
	isRegression: boolean
}

export interface ComparativeReport {
	hasBaseline: boolean
	metrics: ComparativeMetric[]
	regressionAlerts: string[]
	summary: string
}

const formatPillarName: Record<PillarKey, string> = {
	clarity: 'Clareza Estratégica',
	structure: 'Estrutura de Projeto',
	execution: 'Execução Consistente',
	emotional: 'Autogestão Emocional',
}

const toVariation = (
	current: number,
	previous: number | null,
): number | null => {
	if (previous === null) return null
	return Math.round((current - previous) * 10) / 10
}

const toInterpretation = (variation: number | null): string => {
	if (variation === null) return 'Sem base anterior para comparação.'
	if (variation >= 10) return 'Evolução robusta neste indicador.'
	if (variation >= 3) return 'Evolução consistente no período.'
	if (variation <= -10)
		return 'Regressão crítica que exige intervenção imediata.'
	if (variation <= -3) return 'Regressão relevante. Ajuste seu plano de ação.'
	return 'Indicador estável em relação ao ciclo anterior.'
}

const toTrend = (variation: number | null): 'up' | 'down' | 'flat' => {
	if (variation === null) return 'flat'
	if (variation > 0) return 'up'
	if (variation < 0) return 'down'
	return 'flat'
}

const toMetric = (
	key: string,
	label: string,
	current: number,
	previous: number | null,
): ComparativeMetric => {
	const variation = toVariation(current, previous)
	return {
		key,
		label,
		current,
		previous,
		variation,
		interpretation: toInterpretation(variation),
		trend: toTrend(variation),
		isRegression: typeof variation === 'number' && variation <= -8,
	}
}

export const buildComparativeReport = (
	current: DiagnosticCycleModel | null,
	previous: DiagnosticCycleModel | null,
): ComparativeReport => {
	if (!current) {
		return {
			hasBaseline: false,
			metrics: [],
			regressionAlerts: [],
			summary: 'Inicie um diagnóstico para habilitar o relatório comparativo.',
		}
	}

	const metrics: ComparativeMetric[] = [
		toMetric(
			'general',
			'Índice Geral',
			current.indexes.general,
			previous?.indexes.general ?? null,
		),
		toMetric(
			'phase2',
			'Índice Refinado',
			current.indexes.phase2General,
			previous?.indexes.phase2General ?? null,
		),
		...(['clarity', 'structure', 'execution', 'emotional'] as PillarKey[]).map(
			(pillarKey) =>
				toMetric(
					`pillar:${pillarKey}`,
					formatPillarName[pillarKey],
					current.pillars[pillarKey],
					previous?.pillars[pillarKey] ?? null,
				),
		),
	]

	const regressionAlerts = metrics
		.filter((metric) => metric.isRegression)
		.map(
			(metric) =>
				`${metric.label}: queda de ${Math.abs(metric.variation ?? 0).toFixed(1)} pontos percentuais.`,
		)

	const positiveMetrics = metrics.filter(
		(metric) => (metric.variation ?? 0) > 0,
	).length
	const negativeMetrics = metrics.filter(
		(metric) => (metric.variation ?? 0) < 0,
	).length

	let summary = 'Sem ciclo anterior para comparação direta.'
	if (previous) {
		if (positiveMetrics > negativeMetrics) {
			summary =
				'Tendência de evolução geral com avanço na maior parte dos indicadores.'
		} else if (negativeMetrics > positiveMetrics) {
			summary = 'Tendência de regressão em parte relevante dos indicadores.'
		} else {
			summary = 'Oscilação equilibrada entre ganhos e perdas no comparativo.'
		}
	}

	return {
		hasBaseline: Boolean(previous),
		metrics,
		regressionAlerts,
		summary,
	}
}
