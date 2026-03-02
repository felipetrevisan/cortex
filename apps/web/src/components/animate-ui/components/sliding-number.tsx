'use client'

import { cn } from '@cortex/ui/lib/cn'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'

interface SlidingNumberProps {
	value: number
	className?: string
	locale?: string
	formatOptions?: Intl.NumberFormatOptions
	prefix?: string
	suffix?: string
}

export const SlidingNumber = ({
	value,
	className,
	locale = 'pt-BR',
	formatOptions,
	prefix = '',
	suffix = '',
}: SlidingNumberProps) => {
	const reducedMotion = useReducedMotion()
	const previousValueRef = useRef(value)

	const direction = value >= previousValueRef.current ? 1 : -1

	useEffect(() => {
		previousValueRef.current = value
	}, [value])

	const formatter = useMemo(
		() => new Intl.NumberFormat(locale, formatOptions),
		[locale, formatOptions],
	)

	const formattedValue = `${prefix}${formatter.format(value)}${suffix}`

	return (
		<span
			className={cn(
				'relative inline-flex h-[1.1em] items-center overflow-hidden align-middle tabular-nums',
				className,
			)}
			aria-live="polite"
			aria-atomic="true"
		>
			<AnimatePresence initial={false} mode="wait">
				<motion.span
					key={formattedValue}
					className="inline-block leading-none"
					initial={
						reducedMotion
							? { opacity: 0 }
							: { y: direction > 0 ? '120%' : '-120%', opacity: 0 }
					}
					animate={reducedMotion ? { opacity: 1 } : { y: '0%', opacity: 1 }}
					exit={
						reducedMotion
							? { opacity: 0 }
							: { y: direction > 0 ? '-120%' : '120%', opacity: 0 }
					}
					transition={{ duration: 0.24, ease: 'easeOut' }}
				>
					{formattedValue}
				</motion.span>
			</AnimatePresence>
		</span>
	)
}
