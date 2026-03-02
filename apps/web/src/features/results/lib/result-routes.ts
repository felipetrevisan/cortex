export type ResultPhaseSlug = 'phase-1' | 'phase-2'

export const isResultPhaseSlug = (value: string): value is ResultPhaseSlug =>
	value === 'phase-1' || value === 'phase-2'

export const getDiagnosticResultPath = (
	cycleId: string,
	phase: ResultPhaseSlug,
) => `/dashboard/results/${cycleId}/${phase}`
