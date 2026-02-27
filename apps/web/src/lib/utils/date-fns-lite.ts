export const addDays = (date: Date, days: number): Date => {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

export const isAfter = (date: Date, compareDate: Date): boolean =>
	date.getTime() >= compareDate.getTime()

export const parseIsoDate = (value: string | null | undefined): Date | null => {
	if (!value) return null
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getDaysUntil = (
	targetDate: Date,
	referenceDate: Date = new Date(),
): number => {
	const diffMs = targetDate.getTime() - referenceDate.getTime()
	if (diffMs <= 0) return 0
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
