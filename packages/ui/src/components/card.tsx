import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export const Card = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'rounded-2xl border border-border/80 bg-card/78 text-card-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--border)_70%,transparent),0_0_0_1px_color-mix(in_oklch,var(--border)_80%,transparent),0_0_28px_color-mix(in_oklch,var(--accent)_18%,transparent)] backdrop-blur-xl',
			className,
		)}
		{...props}
	/>
)

export const CardHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
)

export const CardTitle = ({
	className,
	...props
}: HTMLAttributes<HTMLHeadingElement>) => (
	<h3
		className={cn('text-base font-semibold tracking-tight', className)}
		{...props}
	/>
)

export const CardDescription = ({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) => (
	<p className={cn('text-sm text-muted-foreground', className)} {...props} />
)

export const CardContent = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('p-5 pt-0', className)} {...props} />
)
