'use client'

import { Badge } from '@cortex/ui/components/badge'
import { Button, type ButtonProps } from '@cortex/ui/components/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@cortex/ui/components/tooltip'
import { cn } from '@cortex/ui/lib/cn'
import type { LucideIcon } from 'lucide-react'
import { Plus, Save } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { IconButton } from '@/components/animate-ui/components/buttons/icon'

export const phaseTypeOptions = [
	{ value: 'phase1', label: 'Fase 1 (Estrutural)' },
	{ value: 'phase2_technical', label: 'Fase 2 (Técnica)' },
	{ value: 'phase2_state', label: 'Fase 2 (Estado Atual)' },
	{ value: 'protocol_reflection', label: 'Protocolo (Reflexão)' },
	{ value: 'protocol_action', label: 'Protocolo (Ação)' },
] as const

export const pillarOptions = [
	{ value: 'none', label: 'Sem pilar' },
	{ value: 'clarity', label: 'Clareza Estratégica' },
	{ value: 'structure', label: 'Estrutura de Projeto' },
	{ value: 'execution', label: 'Execução Consistente' },
	{ value: 'emotional', label: 'Autogestão Emocional' },
] as const

export const selectTriggerClassName =
	'h-11 w-full rounded-xl border-border/80 bg-secondary/55 hover:bg-secondary/75'

export const primaryCtaClassName =
	'h-10 rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'

interface AnimatedActionButtonProps extends ButtonProps {
	icon: LucideIcon
}

interface IconActionButtonProps {
	icon: LucideIcon
	label: string
	onClick: () => void
	disabled?: boolean
	className?: string
	variant?:
		| 'default'
		| 'accent'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
}

interface SectionToolbarProps {
	title: string
	description: string
	actionLabel: string
	actionIcon?: LucideIcon
	onAction: () => void
	actionDisabled?: boolean
}

export const AnimatedActionButton = ({
	icon: Icon,
	children,
	className,
	...props
}: AnimatedActionButtonProps) => (
	<motion.div
		whileHover={{ y: -1, scale: 1.01 }}
		whileTap={{ scale: 0.985 }}
		className="w-fit"
	>
		<Button {...props} className={cn('group', className)}>
			<Icon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
			{children}
		</Button>
	</motion.div>
)

export const IconActionButton = ({
	icon: Icon,
	label,
	onClick,
	disabled,
	className,
	variant = 'default',
}: IconActionButtonProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<span>
				<IconButton
					type="button"
					size="sm"
					variant={variant}
					aria-label={label}
					disabled={disabled}
					className={cn('cursor-pointer', className)}
					onClick={onClick}
				>
					<Icon className="size-4" />
				</IconButton>
			</span>
		</TooltipTrigger>
		<TooltipContent side="top">{label}</TooltipContent>
	</Tooltip>
)

export const SectionToolbar = ({
	title,
	description,
	actionLabel,
	actionIcon = Plus,
	onAction,
	actionDisabled,
}: SectionToolbarProps) => (
	<div className="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h3 className="text-xl font-semibold">{title}</h3>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
		<AnimatedActionButton
			icon={actionIcon}
			className={primaryCtaClassName}
			onClick={onAction}
			disabled={actionDisabled}
		>
			{actionLabel}
		</AnimatedActionButton>
	</div>
)

export const TableShell = ({ children }: { children: ReactNode }) => (
	<div className="overflow-hidden rounded-2xl border border-border/80 bg-card/72 backdrop-blur-lg shadow-[0_0_0_1px_color-mix(in_oklch,var(--border)_65%,transparent),0_0_24px_color-mix(in_oklch,var(--accent)_14%,transparent)]">
		{children}
	</div>
)

export const StatusBadge = ({ active }: { active: boolean }) => (
	<Badge
		variant={active ? 'default' : 'secondary'}
		className={cn(
			'rounded-full px-2.5 py-1 text-xs',
			active
				? 'bg-emerald-600 text-white hover:bg-emerald-500'
				: 'bg-secondary text-secondary-foreground hover:bg-secondary/85',
		)}
	>
		{active ? 'Ativo' : 'Inativo'}
	</Badge>
)

export const EmptyTableState = ({
	colSpan,
	message,
}: {
	colSpan: number
	message: string
}) => (
	<tr>
		<td
			colSpan={colSpan}
			className="h-24 text-center text-sm text-muted-foreground"
		>
			{message}
		</td>
	</tr>
)

export const formatDateTime = (
	value: Date | string | number | null | undefined,
): string => {
	if (value == null) return '-'
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(parsed)
}

export const getProviderLabel = (provider: string): string => {
	const normalized = provider.trim().toLowerCase()
	if (normalized === 'google') return 'Google'
	if (normalized === 'email') return 'E-mail'
	return normalized.length > 0 ? normalized : 'E-mail'
}

export const formatCurrencyFromCents = (value: number | null): string => {
	if (value == null) return '-'
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value / 100)
}

export const parseCurrencyInputToCents = (value: string): number | null => {
	const normalized = value.trim().replace(/\./g, '').replace(',', '.')
	if (!normalized) return null
	const parsed = Number(normalized)
	if (!Number.isFinite(parsed) || parsed < 0) return null
	return Math.round(parsed * 100)
}

export const SaveActionButton = ({
	children,
	disabled,
}: {
	children: ReactNode
	disabled?: boolean
}) => (
	<AnimatedActionButton
		type="submit"
		icon={Save}
		className={primaryCtaClassName}
		disabled={disabled}
	>
		{children}
	</AnimatedActionButton>
)
