'use client'

import { motion } from 'motion/react'

export const HoverLift = ({ children }: { children: React.ReactNode }) => (
	<motion.div
		whileHover={{ y: -4 }}
		transition={{ type: 'spring', stiffness: 260, damping: 20 }}
	>
		{children}
	</motion.div>
)
