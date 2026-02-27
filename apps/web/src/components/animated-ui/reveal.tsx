'use client'

import { cn } from '@cortex/ui/lib/cn'
import { motion } from 'motion/react'

interface RevealProps {
	children: React.ReactNode
	className?: string
	delay?: number
	y?: number
}

export const Reveal = ({
	children,
	className,
	delay = 0,
	y = 16,
}: RevealProps) => (
	<motion.div
		className={cn(className)}
		initial={{ opacity: 0, y }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.45, delay, ease: 'easeOut' }}
	>
		{children}
	</motion.div>
)
