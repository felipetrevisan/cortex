'use client'

import type { TablesInsert } from '@cortex/shared/supabase/database.types'
import { Button, type ButtonProps } from '@cortex/ui/components/button'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { Input } from '@cortex/ui/components/input'
import { cn } from '@cortex/ui/lib/cn'
import {
	ArrowUpDown,
	BadgeCheck,
	Ban,
	Blocks,
	CircleHelp,
	Layers3,
	Loader2,
	type LucideIcon,
	Menu,
	Plus,
	RefreshCw,
	RotateCcw,
	Save,
	ShieldAlert,
	Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
	Highlight,
	HighlightItem,
} from '@/components/animate-ui/primitives/effects/highlight'
import { SlidingNumber } from '@/components/animated-ui/sliding-number'
import { Badge } from '@/components/ui/badge'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from '@/components/ui/sidebar'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
import { useAdminAccess } from '../hooks/use-admin-access'
import { useAdminConfig } from '../hooks/use-admin-config'
import { useAdminUsers } from '../hooks/use-admin-users'

type AdminSection = 'niches' | 'phases' | 'questions' | 'users'

const adminSectionPath: Record<AdminSection, string> = {
	niches: '/admin/niches',
	phases: '/admin/phases',
	questions: '/admin/questions',
	users: '/admin/users',
}

const phaseTypeOptions = [
	{ value: 'phase1', label: 'Fase 1 (Estrutural)' },
	{ value: 'phase2_technical', label: 'Fase 2 (Técnica)' },
	{ value: 'phase2_state', label: 'Fase 2 (Estado Atual)' },
	{ value: 'protocol_reflection', label: 'Protocolo (Reflexão)' },
	{ value: 'protocol_action', label: 'Protocolo (Ação)' },
] as const

const pillarOptions = [
	{ value: 'none', label: 'Sem pilar' },
	{ value: 'clarity', label: 'Clareza Estratégica' },
	{ value: 'structure', label: 'Estrutura de Projeto' },
	{ value: 'execution', label: 'Execução Consistente' },
	{ value: 'emotional', label: 'Autogestão Emocional' },
] as const

const selectTriggerClassName =
	'h-11 w-full rounded-xl border-border/80 bg-secondary/55 hover:bg-secondary/75'
const primaryCtaClassName =
	'h-10 rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'

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
]

interface NicheFormValues {
	name: string
	description: string
}

interface PhaseFormValues {
	nicheId: string
	title: string
	phaseType: TablesInsert<'diagnostic_phases'>['phase_type']
	pillar: string
	blockNumber: string
	orderIndex: number
}

interface QuestionFormValues {
	phaseId: string
	prompt: string
	orderIndex: number
}

interface OptionFormValues {
	phaseId: string
	label: string
	value: number
	orderIndex: number
}

interface AdminNavigationProps {
	activeSection: AdminSection
	onSelectSection: (section: AdminSection) => void
}

interface AdminScreenProps {
	section: AdminSection
}

interface AnimatedActionButtonProps extends ButtonProps {
	icon: LucideIcon
}

interface SectionToolbarProps {
	title: string
	description: string
	actionLabel: string
	actionIcon?: LucideIcon
	onAction: () => void
	actionDisabled?: boolean
}

const AnimatedActionButton = ({
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

const SectionToolbar = ({
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

const TableShell = ({ children }: { children: ReactNode }) => (
	<div className="overflow-hidden rounded-2xl border border-border/80 bg-card/72 backdrop-blur-lg shadow-[0_0_0_1px_color-mix(in_oklch,var(--border)_65%,transparent),0_0_24px_color-mix(in_oklch,var(--accent)_14%,transparent)]">
		{children}
	</div>
)

const AdminNavigation = ({
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

const StatusBadge = ({ active }: { active: boolean }) => (
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

const EmptyTableState = ({
	colSpan,
	message,
}: {
	colSpan: number
	message: string
}) => (
	<TableRow>
		<TableCell
			colSpan={colSpan}
			className="h-24 text-center text-sm text-muted-foreground"
		>
			{message}
		</TableCell>
	</TableRow>
)

const formatDateTime = (value: Date | null): string => {
	if (!value) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(value)
}

const getProviderLabel = (provider: string): string => {
	const normalized = provider.trim().toLowerCase()
	if (normalized === 'google') return 'Google'
	if (normalized === 'email') return 'E-mail'
	return normalized.length > 0 ? normalized : 'E-mail'
}

export const AdminScreen = ({ section }: AdminScreenProps) => {
	const access = useAdminAccess()
	const config = useAdminConfig()
	const adminUsers = useAdminUsers()
	const router = useRouter()
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
	const [isNicheModalOpen, setIsNicheModalOpen] = useState(false)
	const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
	const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false)

	const nicheForm = useForm<NicheFormValues>({
		defaultValues: { name: '', description: '' },
	})
	const phaseForm = useForm<PhaseFormValues>({
		defaultValues: {
			nicheId: '',
			title: '',
			phaseType: 'phase1',
			pillar: 'none',
			blockNumber: '',
			orderIndex: 1,
		},
	})
	const questionForm = useForm<QuestionFormValues>({
		defaultValues: {
			phaseId: '',
			prompt: '',
			orderIndex: 1,
		},
	})
	const optionForm = useForm<OptionFormValues>({
		defaultValues: {
			phaseId: '',
			label: '',
			value: 1,
			orderIndex: 1,
		},
	})

	const activeSection = section
	const setActiveSection = (nextSection: AdminSection) => {
		router.push(adminSectionPath[nextSection])
		setIsMobileNavOpen(false)
	}

	const niches = config.configQuery.data?.niches ?? []
	const phases = config.configQuery.data?.phases ?? []
	const questions = config.configQuery.data?.questions ?? []
	const options = config.configQuery.data?.options ?? []
	const users = adminUsers.usersQuery.data?.users ?? []
	const usersStats = adminUsers.usersQuery.data?.stats ?? {
		total: 0,
		active: 0,
		deleted: 0,
		byProvider: [],
	}
	const signedUserId = access.auth.user?.id ?? null

	const nicheNameById = useMemo(
		() => new Map(niches.map((niche) => [niche.id, niche.name])),
		[niches],
	)
	const phaseNameById = useMemo(
		() => new Map(phases.map((phase) => [phase.id, phase.title])),
		[phases],
	)

	const orderedPhases = useMemo(
		() => [...phases].sort((a, b) => a.orderIndex - b.orderIndex),
		[phases],
	)
	const orderedQuestions = useMemo(
		() => [...questions].sort((a, b) => a.orderIndex - b.orderIndex),
		[questions],
	)
	const orderedOptions = useMemo(
		() => [...options].sort((a, b) => a.orderIndex - b.orderIndex),
		[options],
	)

	if (
		access.isLoading ||
		config.configQuery.isLoading ||
		adminUsers.usersQuery.isLoading
	) {
		return (
			<main className="grid min-h-dvh place-items-center">
				<Loader2 className="size-6 animate-spin text-primary" />
			</main>
		)
	}

	if (config.configQuery.error || adminUsers.usersQuery.error) {
		return (
			<main className="min-h-dvh">
				<DashboardHeader
					name={access.profile?.fullName ?? 'Admin'}
					avatarUrl={access.profile?.avatarUrl ?? null}
					isAdmin
				/>
				<section className="cortex-container py-8">
					<Card className="rounded-3xl border-red-500/30 bg-red-500/10">
						<CardHeader>
							<CardTitle>Configuração do banco pendente</CardTitle>
							<CardDescription>
								Execute as migrations pendentes em `supabase/migrations`
								(incluindo admin e users management) para habilitar o painel
								admin dinâmico.
							</CardDescription>
						</CardHeader>
					</Card>
				</section>
			</main>
		)
	}

	if (!access.isAdmin) {
		return (
			<main className="min-h-dvh">
				<DashboardHeader
					name={access.profile?.fullName ?? 'Usuário'}
					avatarUrl={access.profile?.avatarUrl ?? null}
					isAdmin={false}
				/>
				<section className="cortex-container py-8">
					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldAlert className="size-5 text-amber-500" />
								Acesso restrito
							</CardTitle>
							<CardDescription>
								Somente usuários com role admin podem acessar este painel.
							</CardDescription>
						</CardHeader>
					</Card>
				</section>
			</main>
		)
	}

	return (
		<main className="min-h-dvh pb-10">
			<DashboardHeader
				name={access.profile?.fullName ?? 'Admin'}
				avatarUrl={access.profile?.avatarUrl ?? null}
				isAdmin
			/>

			<section className="mx-auto mt-8 w-[min(1560px,calc(100%-2rem))]">
				<div className="mb-5 flex items-start justify-end gap-3">
					<button
						type="button"
						onClick={() => setIsMobileNavOpen(true)}
						className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:bg-accent md:hidden"
						aria-label="Abrir menu de navegação"
					>
						<Menu className="size-4.5" />
					</button>
				</div>

				<SidebarProvider className="h-[calc(100dvh-11rem)] min-h-[720px] min-h-0 w-full overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-lg shadow-sm">
					<Sidebar collapsible="none" className="hidden h-full md:flex">
						<SidebarContent className="px-3 py-4">
							<SidebarGroup className="p-0">
								<SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.1em]">
									Configuração
								</SidebarGroupLabel>
								<SidebarGroupContent className="pt-1">
									<AdminNavigation
										activeSection={activeSection}
										onSelectSection={setActiveSection}
									/>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>

						<SidebarFooter className="mt-auto border-t border-sidebar-border p-4">
							<div className="grid gap-2.5 text-xs">
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={niches.length}
										className="font-semibold"
									/>{' '}
									nichos
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={phases.length}
										className="font-semibold"
									/>{' '}
									fases
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={questions.length}
										className="font-semibold"
									/>{' '}
									perguntas
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={options.length}
										className="font-semibold"
									/>{' '}
									opções
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={usersStats.total}
										className="font-semibold"
									/>{' '}
									usuários
								</div>
							</div>
						</SidebarFooter>
					</Sidebar>

					<SidebarInset className="h-full min-h-0 overflow-y-auto bg-transparent">
						<div className="w-full min-w-0 space-y-6 p-5 sm:p-7">
							{activeSection === 'niches' ? (
								<div className="space-y-4">
									<SectionToolbar
										title="Nichos cadastrados"
										description="Gerencie status e disponibilidade dos nichos."
										actionLabel="Adicionar novo"
										onAction={() => setIsNicheModalOpen(true)}
									/>

									<TableShell>
										<Table>
											<TableHeader className="bg-secondary/55">
												<TableRow className="hover:bg-secondary/55">
													<TableHead>Nome</TableHead>
													<TableHead>Slug</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className="text-right">Ações</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{niches.length === 0 ? (
													<EmptyTableState
														colSpan={4}
														message="Nenhum nicho cadastrado."
													/>
												) : (
													niches.map((niche) => (
														<TableRow key={niche.id}>
															<TableCell className="font-medium">
																{niche.name}
															</TableCell>
															<TableCell className="text-muted-foreground">
																{niche.slug}
															</TableCell>
															<TableCell>
																<StatusBadge active={niche.isActive} />
															</TableCell>
															<TableCell>
																<div className="flex justify-end gap-2">
																	<AnimatedActionButton
																		size="sm"
																		variant="default"
																		icon={niche.isActive ? Ban : BadgeCheck}
																		className={cn(
																			'rounded-lg border-0 text-white',
																			niche.isActive
																				? 'bg-rose-600 hover:bg-rose-500'
																				: 'bg-emerald-600 hover:bg-emerald-500',
																		)}
																		onClick={() =>
																			config.updateNiche.mutate({
																				id: niche.id,
																				data: { is_active: !niche.isActive },
																			})
																		}
																	>
																		{niche.isActive ? 'Desativar' : 'Ativar'}
																	</AnimatedActionButton>
																</div>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</TableShell>
								</div>
							) : null}

							{activeSection === 'phases' ? (
								<div className="space-y-4">
									<SectionToolbar
										title="Fases cadastradas"
										description="Associe fase, pilar e ordem do fluxo."
										actionLabel="Adicionar novo"
										onAction={() => setIsPhaseModalOpen(true)}
									/>

									<TableShell>
										<Table>
											<TableHeader className="bg-secondary/55">
												<TableRow className="hover:bg-secondary/55">
													<TableHead>Título</TableHead>
													<TableHead>Nicho</TableHead>
													<TableHead>Tipo</TableHead>
													<TableHead>Pilar</TableHead>
													<TableHead>Bloco</TableHead>
													<TableHead>Ordem</TableHead>
													<TableHead>Status</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{orderedPhases.length === 0 ? (
													<EmptyTableState
														colSpan={7}
														message="Nenhuma fase cadastrada."
													/>
												) : (
													orderedPhases.map((phase) => (
														<TableRow key={phase.id}>
															<TableCell className="font-medium">
																{phase.title}
															</TableCell>
															<TableCell>
																{nicheNameById.get(phase.nicheId) ?? '-'}
															</TableCell>
															<TableCell>{phase.phaseType}</TableCell>
															<TableCell>{phase.pillar ?? '-'}</TableCell>
															<TableCell>{phase.blockNumber ?? '-'}</TableCell>
															<TableCell>{phase.orderIndex}</TableCell>
															<TableCell>
																<StatusBadge active={phase.isActive} />
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</TableShell>
								</div>
							) : null}

							{activeSection === 'questions' ? (
								<div className="space-y-8">
									<div className="space-y-4">
										<SectionToolbar
											title="Perguntas cadastradas"
											description="Perguntas por fase com ordem definida."
											actionLabel="Adicionar novo"
											onAction={() => setIsQuestionModalOpen(true)}
											actionDisabled={phases.length === 0}
										/>

										<TableShell>
											<Table>
												<TableHeader className="bg-secondary/55">
													<TableRow className="hover:bg-secondary/55">
														<TableHead>Pergunta</TableHead>
														<TableHead>Fase</TableHead>
														<TableHead>Ordem</TableHead>
														<TableHead>Status</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{orderedQuestions.length === 0 ? (
														<EmptyTableState
															colSpan={4}
															message="Nenhuma pergunta cadastrada."
														/>
													) : (
														orderedQuestions.map((question) => (
															<TableRow key={question.id}>
																<TableCell className="max-w-[520px] whitespace-normal">
																	{question.prompt}
																</TableCell>
																<TableCell>
																	{phaseNameById.get(question.phaseId) ?? '-'}
																</TableCell>
																<TableCell>{question.orderIndex}</TableCell>
																<TableCell>
																	<StatusBadge active={question.isActive} />
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</TableShell>
									</div>

									<div className="space-y-4">
										<SectionToolbar
											title="Opções de resposta"
											description="Escala e labels por fase."
											actionLabel="Adicionar novo"
											actionIcon={Save}
											onAction={() => setIsOptionModalOpen(true)}
											actionDisabled={phases.length === 0}
										/>

										<TableShell>
											<Table>
												<TableHeader className="bg-secondary/55">
													<TableRow className="hover:bg-secondary/55">
														<TableHead>Label</TableHead>
														<TableHead>Valor</TableHead>
														<TableHead>Fase</TableHead>
														<TableHead>Ordem</TableHead>
														<TableHead>Status</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{orderedOptions.length === 0 ? (
														<EmptyTableState
															colSpan={5}
															message="Nenhuma opção cadastrada."
														/>
													) : (
														orderedOptions.map((option) => (
															<TableRow key={option.id}>
																<TableCell className="font-medium">
																	{option.label}
																</TableCell>
																<TableCell>{option.value}</TableCell>
																<TableCell>
																	{phaseNameById.get(option.phaseId) ?? '-'}
																</TableCell>
																<TableCell>{option.orderIndex}</TableCell>
																<TableCell>
																	<StatusBadge active={option.isActive} />
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</TableShell>
									</div>
								</div>
							) : null}

							{activeSection === 'users' ? (
								<div className="space-y-6">
									<SectionToolbar
										title="Usuários cadastrados"
										description="Gerencie método de cadastro, role e soft delete."
										actionLabel="Atualizar lista"
										actionIcon={RefreshCw}
										onAction={() => {
											void adminUsers.usersQuery.refetch()
										}}
										actionDisabled={adminUsers.usersQuery.isFetching}
									/>

									<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
										<Card className="rounded-2xl">
											<CardHeader className="pb-1">
												<CardDescription>Total de usuários</CardDescription>
												<CardTitle className="text-3xl">
													<SlidingNumber value={usersStats.total} />
												</CardTitle>
											</CardHeader>
										</Card>
										<Card className="rounded-2xl">
											<CardHeader className="pb-1">
												<CardDescription>Usuários ativos</CardDescription>
												<CardTitle className="text-3xl">
													<SlidingNumber value={usersStats.active} />
												</CardTitle>
											</CardHeader>
										</Card>
										<Card className="rounded-2xl">
											<CardHeader className="pb-1">
												<CardDescription>Usuários desativados</CardDescription>
												<CardTitle className="text-3xl">
													<SlidingNumber value={usersStats.deleted} />
												</CardTitle>
											</CardHeader>
										</Card>
										<Card className="rounded-2xl">
											<CardHeader className="pb-1">
												<CardDescription>
													Por método de cadastro
												</CardDescription>
												<div className="flex flex-wrap gap-2 pt-3">
													{usersStats.byProvider.length === 0 ? (
														<Badge variant="outline">Sem dados</Badge>
													) : (
														usersStats.byProvider.map((providerStat) => (
															<Badge
																key={providerStat.provider}
																variant="secondary"
																className="rounded-full px-2.5 py-1 text-xs"
															>
																{getProviderLabel(providerStat.provider)}:{' '}
																<SlidingNumber
																	value={providerStat.total}
																	className="font-semibold"
																/>
															</Badge>
														))
													)}
												</div>
											</CardHeader>
										</Card>
									</div>

									<TableShell>
										<Table>
											<TableHeader className="bg-secondary/55">
												<TableRow className="hover:bg-secondary/55">
													<TableHead>Nome</TableHead>
													<TableHead>E-mail</TableHead>
													<TableHead>Método</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Criado em</TableHead>
													<TableHead>Deletado?</TableHead>
													<TableHead className="text-right">Ações</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{users.length === 0 ? (
													<EmptyTableState
														colSpan={8}
														message="Nenhum usuário cadastrado."
													/>
												) : (
													users.map((userItem) => {
														const canEditUser = signedUserId !== userItem.userId
														const isActionPending =
															adminUsers.updateRole.isPending ||
															adminUsers.setSoftDelete.isPending

														return (
															<TableRow key={userItem.id}>
																<TableCell className="font-medium">
																	{userItem.fullName || 'Sem nome'}
																</TableCell>
																<TableCell>{userItem.email || '-'}</TableCell>
																<TableCell>
																	<Badge variant="outline">
																		{getProviderLabel(userItem.authProvider)}
																	</Badge>
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			userItem.role === 'admin'
																				? 'default'
																				: 'secondary'
																		}
																	>
																		{userItem.role === 'admin'
																			? 'Admin'
																			: 'Usuário'}
																	</Badge>
																</TableCell>
																<TableCell>
																	<StatusBadge active={!userItem.isDeleted} />
																</TableCell>
																<TableCell>
																	{formatDateTime(userItem.createdAt)}
																</TableCell>
																<TableCell>
																	{formatDateTime(userItem.deletedAt)}
																</TableCell>
																<TableCell>
																	<div className="flex justify-end gap-2">
																		<AnimatedActionButton
																			size="sm"
																			variant="default"
																			icon={ArrowUpDown}
																			className="rounded-lg border-0 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90"
																			disabled={!canEditUser || isActionPending}
																			onClick={() =>
																				adminUsers.updateRole.mutate({
																					userId: userItem.userId,
																					role:
																						userItem.role === 'admin'
																							? 'user'
																							: 'admin',
																				})
																			}
																		>
																			{userItem.role === 'admin'
																				? 'Tornar usuário'
																				: 'Tornar admin'}
																		</AnimatedActionButton>
																		<AnimatedActionButton
																			size="sm"
																			variant="default"
																			icon={
																				userItem.isDeleted ? RotateCcw : Ban
																			}
																			className={cn(
																				'rounded-lg border-0 text-white',
																				userItem.isDeleted
																					? 'bg-emerald-600 hover:bg-emerald-500'
																					: 'bg-rose-600 hover:bg-rose-500',
																			)}
																			disabled={!canEditUser || isActionPending}
																			onClick={() =>
																				adminUsers.setSoftDelete.mutate({
																					userId: userItem.userId,
																					deleted: !userItem.isDeleted,
																				})
																			}
																		>
																			{userItem.isDeleted
																				? 'Restaurar'
																				: 'Soft delete'}
																		</AnimatedActionButton>
																	</div>
																</TableCell>
															</TableRow>
														)
													})
												)}
											</TableBody>
										</Table>
									</TableShell>
								</div>
							) : null}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</section>

			<Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
				<SheetContent side="left" className="w-[300px] p-0">
					<SheetHeader className="border-b border-border/80 px-4 py-4">
						<SheetTitle className="text-left text-sidebar-foreground">
							Painel Admin
						</SheetTitle>
						<SheetDescription className="text-left text-sidebar-foreground/75">
							Selecione o módulo que deseja editar.
						</SheetDescription>
					</SheetHeader>
					<div className="px-3 py-3">
						<SidebarProvider>
							<Sidebar collapsible="none" className="w-full bg-transparent">
								<SidebarContent className="bg-transparent">
									<SidebarGroup className="p-0">
										<SidebarGroupContent>
											<AdminNavigation
												activeSection={activeSection}
												onSelectSection={setActiveSection}
											/>
										</SidebarGroupContent>
									</SidebarGroup>
								</SidebarContent>
							</Sidebar>
						</SidebarProvider>
					</div>
				</SheetContent>
			</Sheet>

			<Dialog open={isNicheModalOpen} onOpenChange={setIsNicheModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar nicho</DialogTitle>
						<DialogDescription>
							Cadastre um novo nicho para a matriz de diagnóstico.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={nicheForm.handleSubmit(async (values) => {
							await config.createNiche.mutateAsync(values)
							nicheForm.reset({ name: '', description: '' })
							setIsNicheModalOpen(false)
						})}
					>
						<Input
							placeholder="Nome do nicho"
							{...nicheForm.register('name', { required: true })}
						/>
						<Input
							placeholder="Descrição (opcional)"
							{...nicheForm.register('description')}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Plus}
								className={primaryCtaClassName}
								disabled={config.createNiche.isPending}
							>
								Salvar nicho
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar fase</DialogTitle>
						<DialogDescription>
							Defina tipo, pilar e ordem da fase.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={phaseForm.handleSubmit(async (values) => {
							await config.createPhase.mutateAsync({
								niche_id: values.nicheId,
								title: values.title.trim(),
								phase_type: values.phaseType,
								pillar: values.pillar === 'none' ? null : values.pillar || null,
								block_number: values.blockNumber
									? Number(values.blockNumber)
									: null,
								order_index: Number(values.orderIndex),
								is_active: true,
							})
							phaseForm.reset({
								nicheId: '',
								title: '',
								phaseType: 'phase1',
								pillar: 'none',
								blockNumber: '',
								orderIndex: 1,
							})
							setIsPhaseModalOpen(false)
						})}
					>
						<Controller
							control={phaseForm.control}
							name="nicheId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o nicho" />
									</SelectTrigger>
									<SelectContent>
										{niches.map((niche) => (
											<SelectItem key={niche.id} value={niche.id}>
												{niche.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Título da fase"
							{...phaseForm.register('title', { required: true })}
						/>
						<Controller
							control={phaseForm.control}
							name="phaseType"
							rules={{ required: true }}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o tipo da fase" />
									</SelectTrigger>
									<SelectContent>
										{phaseTypeOptions.map((phaseType) => (
											<SelectItem key={phaseType.value} value={phaseType.value}>
												{phaseType.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Controller
							control={phaseForm.control}
							name="pillar"
							render={({ field }) => (
								<Select
									value={field.value || 'none'}
									onValueChange={field.onChange}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o pilar" />
									</SelectTrigger>
									<SelectContent>
										{pillarOptions.map((pillar) => (
											<SelectItem key={pillar.value} value={pillar.value}>
												{pillar.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							type="number"
							placeholder="Nº do bloco (1..3 para protocolo)"
							{...phaseForm.register('blockNumber')}
						/>
						<Input
							type="number"
							placeholder="Ordem da fase"
							{...phaseForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Plus}
								className={primaryCtaClassName}
								disabled={config.createPhase.isPending}
							>
								Salvar fase
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar pergunta</DialogTitle>
						<DialogDescription>
							Cadastre uma pergunta em uma fase existente.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={questionForm.handleSubmit(async (values) => {
							await config.createQuestion.mutateAsync({
								phase_id: values.phaseId,
								prompt: values.prompt.trim(),
								order_index: Number(values.orderIndex),
								is_active: true,
							})
							questionForm.reset({
								phaseId: '',
								prompt: '',
								orderIndex: 1,
							})
							setIsQuestionModalOpen(false)
						})}
					>
						<Controller
							control={questionForm.control}
							name="phaseId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione a fase" />
									</SelectTrigger>
									<SelectContent>
										{orderedPhases.map((phase) => (
											<SelectItem key={phase.id} value={phase.id}>
												{phase.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Pergunta"
							{...questionForm.register('prompt', { required: true })}
						/>
						<Input
							type="number"
							placeholder="Ordem da pergunta"
							{...questionForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Plus}
								className={primaryCtaClassName}
								disabled={config.createQuestion.isPending}
							>
								Salvar pergunta
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar opção de resposta</DialogTitle>
						<DialogDescription>
							Defina label, valor e ordem da opção.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={optionForm.handleSubmit(async (values) => {
							await config.createOption.mutateAsync({
								phase_id: values.phaseId,
								label: values.label.trim(),
								value: Number(values.value),
								order_index: Number(values.orderIndex),
								is_active: true,
							})
							optionForm.reset({
								phaseId: '',
								label: '',
								value: 1,
								orderIndex: 1,
							})
							setIsOptionModalOpen(false)
						})}
					>
						<Controller
							control={optionForm.control}
							name="phaseId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione a fase" />
									</SelectTrigger>
									<SelectContent>
										{orderedPhases.map((phase) => (
											<SelectItem key={phase.id} value={phase.id}>
												{phase.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Label (ex: Nunca)"
							{...optionForm.register('label', { required: true })}
						/>
						<Input
							type="number"
							placeholder="Valor (ex: 1)"
							{...optionForm.register('value', { valueAsNumber: true })}
						/>
						<Input
							type="number"
							placeholder="Ordem da opção"
							{...optionForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Save}
								className={primaryCtaClassName}
								disabled={config.createOption.isPending}
							>
								Salvar opção
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</main>
	)
}
