'use client'

import { DropdownMenuContent } from '@cortex/ui/components/dropdown-menu'
import { cn } from '@cortex/ui/lib/cn'
import { motion } from 'motion/react'
import { forwardRef } from 'react'

type AnimatedDropdownContentProps = React.ComponentPropsWithoutRef<
	typeof DropdownMenuContent
> & {
	motionClassName?: string
}

export const AnimatedDropdownContent = forwardRef<
	React.ElementRef<typeof DropdownMenuContent>,
	AnimatedDropdownContentProps
>(({ className, children, motionClassName, ...props }, ref) => (
	<DropdownMenuContent ref={ref} className={cn('p-1.5', className)} {...props}>
		<motion.div
			className={cn('relative', motionClassName)}
			initial={{ opacity: 0, y: -4, scale: 0.985 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.16, ease: 'easeOut' }}
		>
			{children}
		</motion.div>
	</DropdownMenuContent>
))

AnimatedDropdownContent.displayName = 'AnimatedDropdownContent'
