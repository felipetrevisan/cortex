import { cn } from '../lib/cn'

interface ProgressProps {
	value: number
	className?: string
	indicatorClassName?: string
}

export const Progress = ({
	value,
	className,
	indicatorClassName,
}: ProgressProps) => (
	<div
		className={cn(
			'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
			className,
		)}
	>
		<div
			className={cn('h-full transition-all', indicatorClassName)}
			style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
		/>
	</div>
)
