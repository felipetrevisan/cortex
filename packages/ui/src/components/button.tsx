import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<Variant, string> = {
	default: 'bg-primary text-primary-foreground hover:bg-primary/90',
	secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/85',
	outline:
		'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
	ghost: 'hover:bg-accent hover:text-accent-foreground',
}

const sizeClasses: Record<Size, string> = {
	sm: 'h-9 rounded-lg px-3 text-sm',
	md: 'h-10 rounded-xl px-4 text-sm',
	lg: 'h-11 rounded-xl px-5 text-sm',
	icon: 'size-10 rounded-xl',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant
	size?: Size
}

export const Button = ({
	className,
	variant = 'default',
	size = 'md',
	...props
}: ButtonProps) => (
	<button
		className={cn(
			'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			variantClasses[variant],
			sizeClasses[size],
			className,
		)}
		{...props}
	/>
)
