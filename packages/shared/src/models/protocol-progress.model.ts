import type { Json, Tables } from '../supabase/database.types'

export type ProtocolProgressRow = Tables<'protocol_progress'>

export interface ProtocolProgressModel {
	id: string
	cycleId: string
	userId: string
	currentBlock: number
	blockActions: {
		block1: boolean[]
		block2: boolean[]
		block3: boolean[]
	}
	reflections: Json | null
	completedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface StrategicPlanProgress {
	completedActions: number
	totalActions: number
	ratioLabel: string
}

const sanitizeActionList = (input: boolean[] | null): boolean[] => {
	if (!Array.isArray(input)) return []
	return input.map((value) => Boolean(value))
}

export const mapProtocolProgress = (
	row: ProtocolProgressRow,
): ProtocolProgressModel => ({
	id: row.id,
	cycleId: row.cycle_id,
	userId: row.user_id,
	currentBlock: row.current_block,
	blockActions: {
		block1: sanitizeActionList(row.block1_actions),
		block2: sanitizeActionList(row.block2_actions),
		block3: sanitizeActionList(row.block3_actions),
	},
	reflections: row.reflections,
	completedAt: row.completed_at ? new Date(row.completed_at) : null,
	createdAt: new Date(row.created_at),
	updatedAt: new Date(row.updated_at),
})

export const toStrategicPlanProgress = (
	model: ProtocolProgressModel,
): StrategicPlanProgress => {
	const actionLists = [
		model.blockActions.block1,
		model.blockActions.block2,
		model.blockActions.block3,
	]
	const totalActions = actionLists.reduce(
		(total, current) => total + current.length,
		0,
	)
	const completedActions = actionLists.reduce(
		(total, current) => total + current.filter(Boolean).length,
		0,
	)

	return {
		completedActions,
		totalActions,
		ratioLabel: `${completedActions} / ${totalActions || 0}`,
	}
}

export const inferRecommendedStep = (currentBlock: number): string => {
	if (currentBlock <= 1) return 'Iniciar Bloco 1: Diagnóstico de Base'
	if (currentBlock === 2) return 'Concluir Bloco 2: Alinhamento Estrutural'
	if (currentBlock >= 3) return 'Finalizar Bloco 3: Consolidação de Execução'
	return 'Continuar protocolo adaptativo'
}
