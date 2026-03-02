'use client'

import { cn } from '@cortex/ui/lib/cn'
import {
	Blocks,
	CircleHelp,
	Layers3,
	type LucideIcon,
	Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
	Highlight,
	HighlightItem,
} from '@/components/animate-ui/primitives/effects/highlight'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { AdminSection } from '../lib/admin-sections'

interface AdminNavigationProps {
	activeSection: AdminSection
	onSelectSection: (section: AdminSection) => void
}

interface AdminSectionItem {
	id: AdminSection
	label: string
	description: string
	icon: LucideIcon
}

const adminSections: AdminSectionItem[] = [
	{
		id: 'niches',
		label: 'Nichos',
		description: 'Segmentação e padrão',
		icon: Blocks,
	},
	{
		id: 'phases',
		label: 'Fases',
		description: 'Estrutura por nicho',
		icon: Layers3,
	},
	{
		id: 'questions',
		label: 'Perguntas',
		description: 'Perguntas e respostas',
		icon: CircleHelp,
	},
	{
		id: 'users',
		label: 'Usuários',
		description: 'Acesso e permissões',
		icon: Users,
	},
] as const

export const AdminNavigation = ({
	activeSection,
	onSelectSection,
}: AdminNavigationProps) => (
	<SidebarMenu>
		<Highlight
			mode="parent"
			controlledItems
			value={activeSection}
			hover
			click={false}
			className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary-soft to-tertiary-soft shadow-[0_8px_24px_color-mix(in_oklch,var(--primary)_22%,transparent)]"
			transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.45 }}
		>
			{adminSections.map((sectionItem) => {
				const Icon = sectionItem.icon
				const isActive = activeSection === sectionItem.id

				return (
					<motion.div
						key={sectionItem.id}
						whileHover={{ x: 4 }}
						whileTap={{ scale: 0.985 }}
						transition={{ type: 'spring', stiffness: 420, damping: 34 }}
					>
						<SidebarMenuItem>
							<HighlightItem value={sectionItem.id} asChild>
								<SidebarMenuButton
									type="button"
									isActive={isActive}
									tooltip={sectionItem.label}
									className={cn(
										'h-auto cursor-pointer items-start rounded-lg px-3 py-3 transition-all duration-200',
										'hover:bg-primary-soft hover:text-sidebar-foreground hover:shadow-sm',
										'data-[active=true]:bg-primary-soft data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-sm',
									)}
									onClick={() => onSelectSection(sectionItem.id)}
								>
									<Icon
										className={cn(
											'mt-0.5 size-4 transition-colors duration-200',
											isActive
												? 'text-primary'
												: 'text-sidebar-foreground/70 group-hover/menu-item:text-primary',
										)}
									/>
									<span className="leading-tight">
										<span className="block text-sm font-semibold">
											{sectionItem.label}
										</span>
										<span className="mt-0.5 block text-xs font-normal text-sidebar-foreground/70">
											{sectionItem.description}
										</span>
									</span>
								</SidebarMenuButton>
							</HighlightItem>
						</SidebarMenuItem>
					</motion.div>
				)
			})}
		</Highlight>
	</SidebarMenu>
)
