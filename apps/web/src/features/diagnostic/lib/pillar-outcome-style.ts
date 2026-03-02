import type { CSSProperties } from 'react'

export type PillarOutcomeRole = 'strong' | 'critical'

export const getPillarOutcomeToken = (
	role: PillarOutcomeRole,
): 'pillar-strong' | 'pillar-critical' =>
	role === 'strong' ? 'pillar-strong' : 'pillar-critical'

export const getPillarOutcomeCardStyle = (
	role: PillarOutcomeRole,
): CSSProperties => {
	const colorToken = getPillarOutcomeToken(role)

	return {
		borderColor: `color-mix(in oklch, var(--${colorToken}) 48%, transparent)`,
		background: `linear-gradient(145deg, color-mix(in oklch, var(--${colorToken}) 18%, var(--card)) 0%, color-mix(in oklch, var(--${colorToken}) 7%, var(--card)) 100%)`,
		boxShadow: `0 0 24px color-mix(in oklch, var(--${colorToken}) 20%, transparent)`,
	}
}

export const getPillarOutcomeLabelStyle = (
	role: PillarOutcomeRole,
): CSSProperties => {
	const colorToken = getPillarOutcomeToken(role)

	return {
		color: `color-mix(in oklch, var(--${colorToken}) 80%, var(--foreground))`,
	}
}
