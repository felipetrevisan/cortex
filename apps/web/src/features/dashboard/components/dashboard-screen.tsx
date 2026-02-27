'use client'

import { PILLARS } from '@cortex/shared/constants/pillars'
import { Button } from '@cortex/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { Progress } from '@cortex/ui/components/progress'
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ClipboardCheck,
	FileCheck2,
	Loader2,
	Lock,
	Minus,
	RefreshCcw,
	Rocket,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Reveal } from '@/components/animated-ui/reveal'
import { UserAvatar } from '@/components/layout/user-avatar'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { DiagnosticProcessModal } from '@/features/diagnostic/components/diagnostic-process-modal'
import { ProfileAvatarModal } from '@/features/profile/components/profile-avatar-modal'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { DashboardHeader } from './dashboard-header'
import { PillarGaugeCard } from './pillar-gauge-card'

const statusStyle: Record<string, string> = {
	concluida:
		'border-emerald-300/85 bg-emerald-100 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/24 dark:text-emerald-50',
	pendente:
		'border-amber-300/90 bg-amber-100 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/24 dark:text-amber-50',
	liberada:
		'border-primary/35 bg-primary-soft text-primary dark:border-primary/50 dark:bg-primary-soft dark:text-primary-foreground',
	bloqueada:
		'border-secondary/85 bg-secondary text-secondary-foreground dark:border-secondary/70 dark:bg-secondary dark:text-secondary-foreground',
}

const statusLabel: Record<string, string> = {
	concluida: 'Concluída',
	pendente: 'Pendente',
	liberada: 'Liberada',
	bloqueada: 'Bloqueada',
}

const dashboardCardClassName =
	'h-full rounded-3xl border-border/70 shadow-[0_8px_22px_rgba(2,8,23,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_18%,transparent)]'

const achievementCardStyles = {
	completed:
		'border-amber-400/80 bg-amber-100/65 shadow-[0_0_0_1px_rgba(251,191,36,0.24),0_0_26px_rgba(245,158,11,0.28)] dark:border-amber-400/65 dark:bg-amber-500/12 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.28),0_0_30px_rgba(245,158,11,0.32)]',
	active:
		'border-primary/70 bg-primary-soft shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_26%,transparent),0_0_30px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
	locked: 'border-border/75 bg-secondary/45 shadow-none',
} as const

const achievementStatusLabel = {
	completed: 'Completed',
	active: 'Ativo',
	locked: 'Travado',
} as const

const achievementIconMap = {
	diagnostic: FileCheck2,
	'next-level': Rocket,
	protocol: ClipboardCheck,
	reevaluation: RefreshCcw,
} as const

const formatDate = (
	value: Date | string | number | null | undefined,
): string => {
	if (value == null) return '-'
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(parsed)
}

export const DashboardScreen = () => {
	const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false)
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
	const auth = useAuthRedirect({ requireAuth: true })
	const nicheAccess = useActiveNicheAccess()
	const { isLoading, viewModel } = useDashboardData()

	if (auth.isLoading || isLoading) {
		return (
			<main className="grid min-h-dvh place-items-center">
				<Loader2 className="size-6 animate-spin text-primary" />
			</main>
		)
	}

	return (
		<main className="min-h-dvh pb-10">
			<DashboardHeader
				name={viewModel.greetingName}
				isAdmin={viewModel.isAdmin}
				avatarUrl={viewModel.avatarUrl}
				onEditAvatar={() => setIsAvatarModalOpen(true)}
			/>

			<section className="cortex-container mt-8 space-y-7 md:space-y-8">
				<Reveal>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-3">
							<UserAvatar
								name={viewModel.greetingName}
								avatarUrl={viewModel.avatarUrl}
								size="lg"
							/>
							<h1 className="font-[var(--font-space)] text-3xl tracking-tight">
								Olá, {viewModel.greetingName}
							</h1>
							<span className="rounded-full border border-border/70 bg-secondary/55 px-3 py-1 text-xs font-semibold">
								Nicho ativo: {viewModel.activeNicheName ?? 'Sem nicho'}
							</span>
						</div>
						<p className="max-w-2xl text-muted-foreground">
							Acompanhe sua evolução estrutural e avance para o próximo nível.
						</p>
						<div className="flex flex-wrap items-center gap-3 pt-1">
							{viewModel.availableNiches.length > 1 ? (
								<Select
									{...(nicheAccess.activeNiche?.nicheId
										? { value: nicheAccess.activeNiche.nicheId }
										: {})}
									onValueChange={(nicheId) => {
										void nicheAccess.setActiveNiche(nicheId)
									}}
								>
									<SelectTrigger
										className="h-9 min-w-[220px] rounded-xl border-border/80 bg-card/80 text-xs"
										disabled={nicheAccess.isSwitchingNiche}
									>
										<SelectValue placeholder="Trocar nicho" />
									</SelectTrigger>
									<SelectContent>
										{viewModel.availableNiches.map((niche) => (
											<SelectItem key={niche.nicheId} value={niche.nicheId}>
												{niche.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : null}
						</div>
					</div>
				</Reveal>

				<Reveal delay={0.05} className="grid gap-5 md:grid-cols-3">
					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Avaliação atual</CardDescription>
							<CardTitle className="pt-1">
								<span
									className={`inline-flex rounded-full border px-3.5 py-1 text-sm font-medium ${statusStyle[viewModel.statusCards.current]}`}
								>
									{statusLabel[viewModel.statusCards.current]}
								</span>
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Reavaliação 1</CardDescription>
							<CardTitle className="pt-1">
								<span
									className={`inline-flex rounded-full border px-3.5 py-1 text-sm font-medium ${statusStyle[viewModel.statusCards.reeval45]}`}
								>
									{statusLabel[viewModel.statusCards.reeval45]}
								</span>
							</CardTitle>
							<p className="text-xs text-muted-foreground">
								{viewModel.statusCardMessages.reeval45}
							</p>
						</CardHeader>
					</Card>

					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Novo diagnóstico estrutural</CardDescription>
							<CardTitle className="pt-1">
								<span
									className={`inline-flex rounded-full border px-3.5 py-1 text-sm font-medium ${statusStyle[viewModel.statusCards.reeval90]}`}
								>
									{statusLabel[viewModel.statusCards.reeval90]}
								</span>
							</CardTitle>
							<p className="text-xs text-muted-foreground">
								{viewModel.statusCardMessages.reeval90}
							</p>
						</CardHeader>
					</Card>
				</Reveal>

				<Reveal delay={0.08}>
					<section className="space-y-3">
						<h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
							Conquistas CORTEX
						</h2>
						<div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
							{viewModel.achievements.map((item) => {
								const Icon = achievementIconMap[item.key]
								const isLocked = item.status === 'locked'
								return (
									<Card
										key={item.key}
										className={`rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${achievementCardStyles[item.status]}`}
									>
										<CardContent className="flex min-h-36 flex-col items-center justify-center gap-3 p-5 text-center">
											<div
												className={`rounded-2xl border p-3 ${
													isLocked
														? 'border-border/70 bg-background/70 text-muted-foreground'
														: 'border-white/30 bg-white/65 text-foreground dark:border-white/10 dark:bg-background/45'
												}`}
											>
												{isLocked ? (
													<Lock className="size-6" />
												) : (
													<Icon className="size-6" />
												)}
											</div>
											<div className="space-y-1">
												<p className="text-sm font-semibold">{item.title}</p>
												<p className="text-xs text-muted-foreground">
													{achievementStatusLabel[item.status]}
												</p>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>
					</section>
				</Reveal>

				<Reveal delay={0.1} className="grid gap-5 lg:grid-cols-2">
					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Evolução do plano estratégico</CardDescription>
							<CardTitle className="text-lg">
								{viewModel.strategicRatio} ações concluídas
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 p-6 pt-1">
							<Progress
								value={
									(viewModel.strategicCompleted /
										Math.max(1, viewModel.strategicTotal)) *
									100
								}
								indicatorClassName="bg-primary"
							/>
							<p className="text-sm text-muted-foreground">
								Progresso consolidado do protocolo adaptativo em andamento.
							</p>
						</CardContent>
					</Card>

					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>
								{viewModel.hasStartedDiagnostic
									? 'Próxima Etapa Recomendada'
									: 'Iniciar Diagnóstico'}
							</CardDescription>
							<CardTitle className="text-lg">{viewModel.ctaTitle}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5 p-6 pt-1">
							<p className="text-sm text-muted-foreground">
								{viewModel.ctaDescription}
							</p>
							<motion.div
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.98 }}
								className="w-full sm:w-auto"
							>
								<Button
									className="group h-11 w-full rounded-2xl bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
									disabled={!viewModel.hasNicheAccess}
									onClick={() => setIsDiagnosticModalOpen(true)}
								>
									{viewModel.ctaLabel}
									<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
								</Button>
							</motion.div>
						</CardContent>
					</Card>
				</Reveal>

				<Reveal
					delay={0.15}
					className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
				>
					{PILLARS.map((pillar) => (
						<PillarGaugeCard
							key={pillar.key}
							title={pillar.title}
							colorToken={pillar.colorToken}
							value={viewModel.pillars[pillar.key]}
						/>
					))}
				</Reveal>

				<Reveal delay={0.2} className="grid gap-5 xl:grid-cols-2">
					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Histórico de ciclos</CardDescription>
							<CardTitle className="text-lg">
								Evolução completa dos diagnósticos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 p-6 pt-1">
							{viewModel.history.length === 0 ? (
								<p className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
									Nenhum ciclo registrado até o momento.
								</p>
							) : (
								viewModel.history.map((item) => (
									<div
										key={item.cycle.id}
										className="rounded-2xl border border-border/70 bg-muted/35 p-4"
									>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<p className="font-semibold">
												Ciclo {item.cycle.cycleNumber}
											</p>
											<span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold">
												{item.statusLabel}
											</span>
										</div>
										<p className="mt-2 text-sm text-muted-foreground">
											{item.nextAction}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Ações disponíveis: {item.completedActions} /{' '}
											{item.totalActions}
										</p>
										<div className="mt-2 space-y-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs">
											<p className="font-semibold">
												{item.timeline.protocolAuditMessage}
											</p>
											<p className="font-semibold">
												{item.timeline.reeval45AuditMessage}
											</p>
										</div>
										<div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
											<p>
												Início do ciclo: {formatDate(item.timeline.startedAt)}
											</p>
											<p>
												Conclusão do protocolo:{' '}
												{formatDate(item.timeline.protocolCompletedAt)}
											</p>
											<p>
												Reavaliação (45 dias):{' '}
												{formatDate(item.timeline.reeval45AvailableAt)}
											</p>
											<p className="sm:col-span-2">
												Contagem regressiva (45 dias):{' '}
												{item.timeline.reeval45Countdown}
											</p>
											<p>
												Novo diagnóstico (90 dias):{' '}
												{formatDate(item.timeline.newDiagnosticAvailableAt)}
											</p>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>

					<Card className={dashboardCardClassName}>
						<CardHeader className="gap-2 p-6">
							<CardDescription>Relatório comparativo</CardDescription>
							<CardTitle className="text-lg">
								Variação percentual e alertas
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 p-6 pt-1">
							<p className="text-sm text-muted-foreground">
								{viewModel.comparative.summary}
							</p>

							{viewModel.comparative.metrics.length === 0 ? (
								<p className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
									Complete ao menos um ciclo para habilitar comparações.
								</p>
							) : (
								<div className="space-y-2">
									{viewModel.comparative.metrics.map((metric) => (
										<div
											key={metric.key}
											className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3"
										>
											<div>
												<p className="text-sm font-semibold">{metric.label}</p>
												<p className="text-xs text-muted-foreground">
													{metric.interpretation}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold">
													{metric.current}%
												</span>
												<span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1 text-xs font-semibold">
													{metric.trend === 'up' ? (
														<ArrowUp className="size-3.5 text-emerald-600" />
													) : null}
													{metric.trend === 'down' ? (
														<ArrowDown className="size-3.5 text-red-600" />
													) : null}
													{metric.trend === 'flat' ? (
														<Minus className="size-3.5 text-muted-foreground" />
													) : null}
													{metric.variation === null
														? 'N/A'
														: `${metric.variation > 0 ? '+' : ''}${metric.variation.toFixed(1)} pp`}
												</span>
											</div>
										</div>
									))}
								</div>
							)}

							{viewModel.comparative.regressionAlerts.length > 0 ? (
								<div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
									<p className="text-sm font-semibold text-red-700 dark:text-red-300">
										Alertas de regressão
									</p>
									{viewModel.comparative.regressionAlerts.map((alert) => (
										<p
											key={alert}
											className="text-xs text-red-700 dark:text-red-300"
										>
											{alert}
										</p>
									))}
								</div>
							) : null}
						</CardContent>
					</Card>
				</Reveal>
			</section>

			<DiagnosticProcessModal
				open={isDiagnosticModalOpen}
				onOpenChange={setIsDiagnosticModalOpen}
			/>
			<ProfileAvatarModal
				open={isAvatarModalOpen}
				onOpenChange={setIsAvatarModalOpen}
				fullName={viewModel.greetingName}
				currentAvatarUrl={viewModel.avatarUrl}
			/>
		</main>
	)
}
