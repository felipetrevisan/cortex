import type { PillarKey } from '../constants/pillars'
import type { Tables } from '../supabase/database.types'

export type DiagnosticNicheRow = Tables<'diagnostic_niches'>
export type DiagnosticPhaseRow = Tables<'diagnostic_phases'>
export type DiagnosticPhaseQuestionRow = Tables<'diagnostic_phase_questions'>
export type DiagnosticPhaseOptionRow = Tables<'diagnostic_phase_options'>

export type DiagnosticPhaseType =
	| 'phase1'
	| 'phase2_technical'
	| 'phase2_state'
	| 'protocol_reflection'
	| 'protocol_action'

export interface DiagnosticPhaseOptionModel {
	id: string
	phaseId: string
	label: string
	value: number
	orderIndex: number
	isActive: boolean
}

export interface DiagnosticPhaseQuestionModel {
	id: string
	phaseId: string
	prompt: string
	orderIndex: number
	isActive: boolean
}

export interface DiagnosticPhaseModel {
	id: string
	nicheId: string
	title: string
	phaseType: DiagnosticPhaseType
	pillar: PillarKey | null
	blockNumber: number | null
	orderIndex: number
	isActive: boolean
}

export interface DiagnosticNicheModel {
	id: string
	name: string
	slug: string
	description: string | null
	isActive: boolean
}

const toPillar = (value: string | null): PillarKey | null => {
	if (
		value === 'clarity' ||
		value === 'structure' ||
		value === 'execution' ||
		value === 'emotional'
	) {
		return value
	}
	return null
}

export const mapDiagnosticNiche = (
	row: DiagnosticNicheRow,
): DiagnosticNicheModel => ({
	id: row.id,
	name: row.name,
	slug: row.slug,
	description: row.description,
	isActive: row.is_active,
})

export const mapDiagnosticPhase = (
	row: DiagnosticPhaseRow,
): DiagnosticPhaseModel => ({
	id: row.id,
	nicheId: row.niche_id,
	title: row.title,
	phaseType: row.phase_type as DiagnosticPhaseType,
	pillar: toPillar(row.pillar),
	blockNumber: row.block_number,
	orderIndex: row.order_index,
	isActive: row.is_active,
})

export const mapDiagnosticPhaseQuestion = (
	row: DiagnosticPhaseQuestionRow,
): DiagnosticPhaseQuestionModel => ({
	id: row.id,
	phaseId: row.phase_id,
	prompt: row.prompt,
	orderIndex: row.order_index,
	isActive: row.is_active,
})

export const mapDiagnosticPhaseOption = (
	row: DiagnosticPhaseOptionRow,
): DiagnosticPhaseOptionModel => ({
	id: row.id,
	phaseId: row.phase_id,
	label: row.label,
	value: row.value,
	orderIndex: row.order_index,
	isActive: row.is_active,
})
