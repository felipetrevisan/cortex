'use client'

import { XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DialogStateContextValue {
	open: boolean
}

const DialogStateContext = React.createContext<DialogStateContextValue | null>(
	null,
)

const useDialogState = () => React.useContext(DialogStateContext)

function Dialog({
	open: openProp,
	defaultOpen,
	onOpenChange,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	const isControlled = openProp !== undefined
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
		defaultOpen ?? false,
	)
	const open = isControlled ? Boolean(openProp) : uncontrolledOpen

	const handleOpenChange = React.useCallback(
		(nextOpen: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(nextOpen)
			}
			onOpenChange?.(nextOpen)
		},
		[isControlled, onOpenChange],
	)

	return (
		<DialogStateContext.Provider value={{ open }}>
			<DialogPrimitive.Root
				data-slot="dialog"
				open={open}
				onOpenChange={handleOpenChange}
				{...props}
			/>
		</DialogStateContext.Provider>
	)
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
	className,
	forceMount,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	const dialogState = useDialogState()
	const shouldRender = forceMount || (dialogState ? dialogState.open : true)

	return (
		<AnimatePresence>
			{shouldRender ? (
				<DialogPrimitive.Overlay
					data-slot="dialog-overlay"
					forceMount
					asChild
					{...props}
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className={cn(
							'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
							className,
						)}
					/>
				</DialogPrimitive.Overlay>
			) : null}
		</AnimatePresence>
	)
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	forceMount,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean
}) {
	const dialogState = useDialogState()
	const shouldRender = forceMount || (dialogState ? dialogState.open : true)

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<AnimatePresence>
				{shouldRender ? (
					<DialogPrimitive.Content
						data-slot="dialog-content"
						forceMount
						asChild
						{...props}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: 8 }}
							transition={{ duration: 0.22, ease: 'easeOut' }}
							className={cn(
								'bg-background/80 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-5 rounded-2xl border border-border/70 p-7 shadow-2xl backdrop-blur-lg outline-none sm:max-w-lg',
								className,
							)}
						>
							{children}
							{showCloseButton && (
								<DialogPrimitive.Close
									data-slot="dialog-close"
									className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
								>
									<XIcon />
									<span className="sr-only">Close</span>
								</DialogPrimitive.Close>
							)}
						</motion.div>
					</DialogPrimitive.Content>
				) : null}
			</AnimatePresence>
		</DialogPortal>
	)
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="dialog-header"
			className={cn(
				'flex flex-col gap-2.5 text-center sm:text-left',
				className,
			)}
			{...props}
		/>
	)
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<'div'> & {
	showCloseButton?: boolean
}) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				'flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end',
				className,
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close asChild>
					<Button variant="outline">Close</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	)
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('text-lg leading-none font-semibold', className)}
			{...props}
		/>
	)
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
}
