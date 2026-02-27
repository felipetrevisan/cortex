const DAY_MS = 1000 * 60 * 60 * 24

const addDays = (date: Date, days: number): Date => {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

const getDaysUntil = (
	targetDate: Date,
	referenceDate: Date = new Date(),
): number => {
	const diffMs = targetDate.getTime() - referenceDate.getTime()
	if (diffMs <= 0) return 0
	return Math.ceil(diffMs / DAY_MS)
}

const formatDayLabel = (days: number): string =>
	`${days} ${days === 1 ? 'dia' : 'dias'}`

export interface TemporalGate {
	isLocked: boolean
	daysRemaining: number | null
	availableAt: Date | null
	message: string
}

export interface DiagnosticTemporalRules {
	phase2Reevaluation: TemporalGate
	newStructuralDiagnosis: TemporalGate
	canRunPhase2Reevaluation: boolean
	canStartNewCycle: boolean
}

interface DiagnosticTemporalRulesInput {
	phase1CompletedAt: Date | null
	protocolCompletedAt: Date | null
	reeval45CompletedAt: Date | null
	now?: Date
}

export const computeDiagnosticTemporalRules = (
	input: DiagnosticTemporalRulesInput,
): DiagnosticTemporalRules => {
	const now = input.now ?? new Date()

	const phase2AvailableAt = input.protocolCompletedAt
		? addDays(input.protocolCompletedAt, 45)
		: null
	const phase2DaysRemaining = phase2AvailableAt
		? getDaysUntil(phase2AvailableAt, now)
		: null
	const phase2Locked = phase2AvailableAt ? (phase2DaysRemaining ?? 0) > 0 : true

	const phase2Message = !input.protocolCompletedAt
		? 'Reavaliação disponível após concluir o Protocolo de Ação.'
		: typeof phase2DaysRemaining === 'number' && phase2DaysRemaining > 0
			? `Reavaliação disponível em ${formatDayLabel(phase2DaysRemaining)}.`
			: 'Reavaliação liberada.'

	const newDiagnosticAvailableAt = input.phase1CompletedAt
		? addDays(input.phase1CompletedAt, 90)
		: null
	const newDiagnosticDaysRemaining = newDiagnosticAvailableAt
		? getDaysUntil(newDiagnosticAvailableAt, now)
		: null
	const newDiagnosticLocked = newDiagnosticAvailableAt
		? (newDiagnosticDaysRemaining ?? 0) > 0
		: true

	const newDiagnosticMessage = !input.phase1CompletedAt
		? 'Novo diagnóstico estrutural disponível após concluir a Fase 1.'
		: typeof newDiagnosticDaysRemaining === 'number' &&
				newDiagnosticDaysRemaining > 0
			? `Novo diagnóstico estrutural disponível em ${formatDayLabel(newDiagnosticDaysRemaining)}.`
			: 'Novo diagnóstico estrutural liberado.'

	return {
		phase2Reevaluation: {
			isLocked: phase2Locked,
			daysRemaining: phase2DaysRemaining,
			availableAt: phase2AvailableAt,
			message: phase2Message,
		},
		newStructuralDiagnosis: {
			isLocked: newDiagnosticLocked,
			daysRemaining: newDiagnosticDaysRemaining,
			availableAt: newDiagnosticAvailableAt,
			message: newDiagnosticMessage,
		},
		canRunPhase2Reevaluation:
			Boolean(input.protocolCompletedAt) &&
			!input.reeval45CompletedAt &&
			!phase2Locked &&
			newDiagnosticLocked,
		canStartNewCycle:
			Boolean(input.protocolCompletedAt) && !newDiagnosticLocked,
	}
}
