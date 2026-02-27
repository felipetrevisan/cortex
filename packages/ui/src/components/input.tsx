import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export const Input = ({
	className,
	...props
}: InputHTMLAttributes<HTMLInputElement>) => (
	<input
		className={cn(
			'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
			className,
		)}
		{...props}
	/>
)
