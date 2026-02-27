'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { cn } from '@cortex/ui/lib/cn'
import type { CSSProperties } from 'react'
import { HoverLift } from '@/components/animated-ui/hover-lift'

interface PillarGaugeCardProps {
	title: string
	value: number
	colorToken: string
}

export const PillarGaugeCard = ({
	title,
	value,
	colorToken,
}: PillarGaugeCardProps) => {
	const gaugeValue = Math.max(0, Math.min(100, value))
	const radius = 52
	const circumference = Math.PI * radius
	const dashOffset = circumference * (1 - gaugeValue / 100)
	const cardStyle = {
		borderColor: `color-mix(in oklch, var(--${colorToken}) 64%, transparent)`,
		'--glow-color': `var(--${colorToken})`,
	} as CSSProperties

	return (
		<HoverLift>
			<Card
				className={cn(
					'relative h-full overflow-hidden rounded-3xl border-2',
					'shadow-[0_0_28px_color-mix(in_oklch,var(--glow-color)_36%,transparent)]',
				)}
				style={cardStyle}
			>
				<CardHeader className="gap-2 p-6 pb-2">
					<CardDescription>Pilar estrutural</CardDescription>
					<CardTitle className="font-[var(--font-space)] text-base">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 p-6 pt-3">
					<div className="relative mx-auto w-full max-w-[220px]">
						<svg
							viewBox="0 0 140 86"
							className="w-full overflow-visible"
							aria-hidden="true"
						>
							<path
								d="M 18 70 A 52 52 0 0 1 122 70"
								fill="none"
								stroke="color-mix(in oklch, var(--foreground) 10%, transparent)"
								strokeWidth="12"
								strokeLinecap="round"
							/>
							<path
								d="M 18 70 A 52 52 0 0 1 122 70"
								fill="none"
								stroke={`var(--${colorToken})`}
								strokeWidth="12"
								strokeLinecap="round"
								strokeDasharray={circumference}
								strokeDashoffset={dashOffset}
								className="transition-all duration-700 ease-out"
							/>
						</svg>

						<div className="absolute inset-x-0 bottom-1 text-center">
							<strong className="text-3xl font-semibold tracking-tight">
								{gaugeValue}%
							</strong>
						</div>
					</div>
					<p className="text-center text-sm font-medium leading-relaxed text-muted-foreground">
						Crítico
					</p>
				</CardContent>
			</Card>
		</HoverLift>
	)
}
