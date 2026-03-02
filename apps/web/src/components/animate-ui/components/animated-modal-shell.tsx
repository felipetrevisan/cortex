'use client'

import { cn } from '@cortex/ui/lib/cn'
import { AnimatePresence, motion } from 'motion/react'

interface AnimatedModalShellProps {
	open: boolean
	onOpenChange: (nextOpen: boolean) => void
	children: React.ReactNode
	contentClassName?: string
	closeOnOverlayClick?: boolean
	disabled?: boolean
}

export const AnimatedModalShell = ({
	open,
	onOpenChange,
	children,
	contentClassName,
	closeOnOverlayClick = true,
	disabled = false,
}: AnimatedModalShellProps) => (
	<AnimatePresence>
		{open ? (
			<motion.div
				className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onMouseDown={(event) => {
					if (!closeOnOverlayClick || disabled) return
					if (event.target === event.currentTarget) {
						onOpenChange(false)
					}
				}}
			>
				<motion.div
					className={cn('w-full max-w-3xl', contentClassName)}
					initial={{ opacity: 0, y: 12, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 12, scale: 0.98 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
				>
					{children}
				</motion.div>
			</motion.div>
		) : null}
	</AnimatePresence>
)
