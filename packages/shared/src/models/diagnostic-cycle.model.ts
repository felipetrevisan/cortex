import type { PillarKey } from '../constants/pillars'
import type { Tables } from '../supabase/database.types'

export type DiagnosticCycleRow = Tables<'diagnostic_cycles'>

export interface DiagnosticCycleModel {
	id: string
	userId: string
	nicheId: string | null
	cycleNumber: number
	status: string
	startedAt: Date
	updatedAt: Date
	indexes: {
		general: number
		phase2General: number
		phase2Technical: number
		phase2State: number
	}
	pillars: Record<PillarKey, number>
	highlights: {
		strong: string | null
		critical: string | null
	}
	timeline: {
		phase1CompletedAt: Date | null
		phase2CompletedAt: Date | null
		protocolCompletedAt: Date | null
		reeval45CompletedAt: Date | null
		reeval90CompletedAt: Date | null
	}
}

const toPercent = (value: number | null): number => {
	if (typeof value !== 'number' || Number.isNaN(value)) return 0
	return Math.min(100, Math.max(0, Math.round(value)))
}

const toDate = (value: string | null): Date | null => {
	if (!value) return null
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const mapDiagnosticCycle = (
	row: DiagnosticCycleRow,
): DiagnosticCycleModel => ({
	id: row.id,
	userId: row.user_id,
	nicheId: row.niche_id,
	cycleNumber: row.cycle_number,
	status: row.status,
	startedAt: new Date(row.started_at),
	updatedAt: new Date(row.updated_at),
	indexes: {
		general: toPercent(row.general_index),
		phase2General: toPercent(row.phase2_general_index),
		phase2Technical: toPercent(row.phase2_technical_index),
		phase2State: toPercent(row.phase2_state_index),
	},
	pillars: {
		clarity: toPercent(row.pillar_clarity),
		structure: toPercent(row.pillar_structure),
		execution: toPercent(row.pillar_execution),
		emotional: toPercent(row.pillar_emotional),
	},
	highlights: {
		strong: row.strong_pillar,
		critical: row.critical_pillar,
	},
	timeline: {
		phase1CompletedAt: toDate(row.phase1_completed_at),
		phase2CompletedAt: toDate(row.phase2_completed_at),
		protocolCompletedAt: toDate(row.protocol_completed_at),
		reeval45CompletedAt: toDate(row.reeval_45_completed_at),
		reeval90CompletedAt: toDate(row.reeval_90_completed_at),
	},
})
