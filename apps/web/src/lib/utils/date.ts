import { addDays, isAfter } from './date-fns-lite'

export const isReevaluationUnlocked = (
	startedAt: Date,
	days: number,
	completedAt: Date | null,
): 'concluida' | 'liberada' | 'bloqueada' => {
	if (completedAt) return 'concluida'
	return isAfter(new Date(), addDays(startedAt, days))
		? 'liberada'
		: 'bloqueada'
}
