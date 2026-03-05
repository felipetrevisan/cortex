'use client'

import {
	classifyGeneralStructure,
	classifyMaturity,
	classifyPhase2Refined,
} from '@cortex/shared/domain/diagnostic-calculations'
import { Badge } from '@cortex/ui/components/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import {
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	GitCompareArrows,
	Loader2,
	PieChart,
	Radar,
	ShieldAlert,
	Sparkles,
	Target,
	Trophy,
} from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useProfileQuery } from '@/features/auth/hooks/use-profile-query'
import { resolveIsAdmin } from '@/features/auth/lib/role'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
import {
	getCriticalPillarDescription,
	getStrongPillarDescription,
} from '@/features/diagnostic/lib/pillar-highlight-copy'
import {
	getPillarOutcomeCardStyle,
	getPillarOutcomeLabelStyle,
} from '@/features/diagnostic/lib/pillar-outcome-style'
import { cn } from '@/lib/utils'
import {
	buildDonutBackground,
	pillarTitle,
	useDiagnosticResultQuery,
} from '../hooks/use-diagnostic-result-query'
import type { ResultPhaseSlug } from '../lib/result-routes'

const formatDate = (value: Date | null): string => {
	if (!value) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'long',
	}).format(value)
}

const getStructuralInsightIcon = (id: string) => {
	switch (id) {
		case 'asymmetry':
			return GitCompareArrows
		case 'risk':
			return ShieldAlert
		case 'coherence':
			return Radar
		case 'projection':
			return Target
		default:
			return Sparkles
	}
}

const getPhase2ExecutiveCardStyle = (
	level: 'critico' | 'instavel' | 'funcional' | 'solido',
): CSSProperties => {
	if (level === 'critico') {
		return {
			borderColor: 'color-mix(in oklch, var(--color-red-700) 60%, transparent)',
			background:
				'linear-gradient(135deg, color-mix(in oklch, var(--color-red-700) 24%, var(--card)) 0%, color-mix(in oklch, var(--color-red-700) 12%, var(--card)) 100%)',
			boxShadow:
				'0 18px 48px rgba(2,8,23,0.14), 0 0 36px color-mix(in oklch, var(--color-red-700) 26%, transparent)',
		}
	}

	if (level === 'instavel') {
		return {
			borderColor:
				'color-mix(in oklch, var(--color-orange-500) 56%, transparent)',
			background:
				'linear-gradient(135deg, color-mix(in oklch, var(--color-orange-500) 18%, var(--card)) 0%, color-mix(in oklch, var(--color-red-500) 12%, var(--card)) 100%)',
			boxShadow:
				'0 18px 48px rgba(2,8,23,0.14), 0 0 34px color-mix(in oklch, var(--color-orange-500) 24%, transparent)',
		}
	}

	if (level === 'funcional') {
		return {
			borderColor:
				'color-mix(in oklch, var(--color-yellow-500) 56%, transparent)',
			background:
				'linear-gradient(135deg, color-mix(in oklch, var(--color-yellow-500) 18%, var(--card)) 0%, color-mix(in oklch, var(--color-amber-500) 10%, var(--card)) 100%)',
			boxShadow:
				'0 18px 48px rgba(2,8,23,0.14), 0 0 34px color-mix(in oklch, var(--color-yellow-500) 24%, transparent)',
		}
	}

	return {
		borderColor:
			'color-mix(in oklch, var(--color-emerald-500) 58%, transparent)',
		background:
			'linear-gradient(135deg, color-mix(in oklch, var(--color-emerald-500) 16%, var(--card)) 0%, color-mix(in oklch, var(--color-emerald-500) 8%, var(--card)) 100%)',
		boxShadow:
			'0 18px 48px rgba(2,8,23,0.14), 0 0 34px color-mix(in oklch, var(--color-emerald-500) 24%, transparent)',
	}
}

const getTechnicalPatternStyle = (
	severity: 'baixa' | 'moderada' | 'alta',
): CSSProperties => {
	if (severity === 'alta') {
		return {
			borderColor: 'color-mix(in oklch, var(--color-red-500) 54%, transparent)',
			background:
				'linear-gradient(145deg, color-mix(in oklch, var(--color-red-500) 16%, var(--card)) 0%, color-mix(in oklch, var(--color-red-500) 8%, var(--card)) 100%)',
			boxShadow:
				'0 0 26px color-mix(in oklch, var(--color-red-500) 24%, transparent)',
		}
	}

	if (severity === 'moderada') {
		return {
			borderColor:
				'color-mix(in oklch, var(--color-orange-500) 54%, transparent)',
			background:
				'linear-gradient(145deg, color-mix(in oklch, var(--color-orange-500) 14%, var(--card)) 0%, color-mix(in oklch, var(--color-orange-500) 7%, var(--card)) 100%)',
			boxShadow:
				'0 0 24px color-mix(in oklch, var(--color-orange-500) 20%, transparent)',
		}
	}

	return {
		borderColor:
			'color-mix(in oklch, var(--color-yellow-500) 48%, transparent)',
		background:
			'linear-gradient(145deg, color-mix(in oklch, var(--color-yellow-500) 12%, var(--card)) 0%, color-mix(in oklch, var(--color-yellow-500) 6%, var(--card)) 100%)',
		boxShadow:
			'0 0 20px color-mix(in oklch, var(--color-yellow-500) 16%, transparent)',
	}
}

const getTechnicalPatternBadgeClass = (
	severity: 'baixa' | 'moderada' | 'alta',
): string => {
	if (severity === 'alta') return 'bg-red-500/85 text-red-50'
	if (severity === 'moderada') return 'bg-orange-500/85 text-orange-50'
	return 'bg-yellow-500/85 text-yellow-950'
}

const getTechnicalPatternSeverityLabel = (
	severity: 'baixa' | 'moderada' | 'alta',
): string => {
	if (severity === 'alta') return 'Criticidade alta'
	if (severity === 'moderada') return 'Criticidade moderada'
	return 'Criticidade baixa'
}

const getTechnicalPatternTitleClass = (
	severity: 'baixa' | 'moderada' | 'alta',
): string => {
	if (severity === 'alta') return 'text-red-300'
	if (severity === 'moderada') return 'text-orange-300'
	return 'text-yellow-300'
}

const getStateBlockStyle = (
	level: 'critico' | 'moderado' | 'favoravel',
): CSSProperties => {
	if (level === 'critico') {
		return {
			borderColor: 'color-mix(in oklch, var(--color-red-500) 52%, transparent)',
			background:
				'linear-gradient(145deg, color-mix(in oklch, var(--color-red-500) 12%, var(--card)) 0%, color-mix(in oklch, var(--color-red-500) 6%, var(--card)) 100%)',
			boxShadow:
				'0 0 24px color-mix(in oklch, var(--color-red-500) 20%, transparent)',
		}
	}

	if (level === 'moderado') {
		return {
			borderColor:
				'color-mix(in oklch, var(--color-yellow-500) 52%, transparent)',
			background:
				'linear-gradient(145deg, color-mix(in oklch, var(--color-yellow-500) 12%, var(--card)) 0%, color-mix(in oklch, var(--color-yellow-500) 6%, var(--card)) 100%)',
			boxShadow:
				'0 0 24px color-mix(in oklch, var(--color-yellow-500) 20%, transparent)',
		}
	}

	return {
		borderColor:
			'color-mix(in oklch, var(--color-emerald-500) 52%, transparent)',
		background:
			'linear-gradient(145deg, color-mix(in oklch, var(--color-emerald-500) 12%, var(--card)) 0%, color-mix(in oklch, var(--color-emerald-500) 6%, var(--card)) 100%)',
		boxShadow:
			'0 0 24px color-mix(in oklch, var(--color-emerald-500) 20%, transparent)',
	}
}

const getStateBlockLabelClass = (
	level: 'critico' | 'moderado' | 'favoravel',
): string => {
	if (level === 'critico') return 'text-red-400'
	if (level === 'moderado') return 'text-yellow-400'
	return 'text-emerald-400'
}

const getStateBlockLabel = (
	level: 'critico' | 'moderado' | 'favoravel',
): string => {
	if (level === 'critico') return 'Crítico'
	if (level === 'moderado') return 'Moderado'
	return 'Favorável'
}

const DetailBarChart = ({
	items,
}: {
	items: Array<{
		label: string
		value: number
		colorToken: string
		description?: string
	}>
}) => (
	<div className="space-y-4">
		{items.map((item) => {
			const maturity = classifyMaturity(item.value)
			const summaryText = item.description
				? item.description.includes(':')
					? item.description
					: `${maturity.label}: ${item.description}`
				: `${maturity.label}: ${maturity.description}`

			return (
				<div key={item.label} className="space-y-1.5">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-base font-semibold">{item.label}</p>
							<p className="mt-1 text-sm leading-6 text-foreground/78">
								{summaryText}
							</p>
						</div>
						<span className="text-sm font-semibold">{item.value}%</span>
					</div>
					<div className="h-3 rounded-full bg-secondary/70">
						<div
							className="h-full rounded-full transition-all duration-500"
							style={{
								width: `${Math.max(0, Math.min(100, item.value))}%`,
								background: `linear-gradient(90deg, color-mix(in oklch, var(--${item.colorToken}) 88%, white) 0%, var(--${item.colorToken}) 100%)`,
								boxShadow: `0 0 18px color-mix(in oklch, var(--${item.colorToken}) 28%, transparent)`,
							}}
						/>
					</div>
				</div>
			)
		})}
	</div>
)

const DetailDonutChart = ({
	title,
	segments,
}: {
	title: string
	segments: Array<{
		label: string
		value: number
		colorToken: string
	}>
}) => (
	<Card className="h-full rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)] flex flex-col">
		<CardHeader className="p-6 pb-2">
			<CardTitle className="flex items-center gap-2 text-lg">
				<PieChart className="size-4 text-primary" />
				{title}
			</CardTitle>
		</CardHeader>
		<CardContent className="grid flex-1 place-items-center p-6 pt-2">
			<div
				className="relative mx-auto size-56 rounded-full xl:size-64"
				style={{
					background: buildDonutBackground(
						segments.map((segment) => ({
							value: segment.value,
							color: `var(--${segment.colorToken})`,
						})),
					),
				}}
			>
				<div className="absolute inset-6 rounded-full bg-card/95 backdrop-blur-lg xl:inset-7" />
			</div>
		</CardContent>
	</Card>
)

export const DiagnosticResultScreen = ({
	cycleId,
	phase,
}: {
	cycleId: string
	phase: ResultPhaseSlug
}) => {
	const auth = useAuthRedirect({ requireAuth: true })
	const profileQuery = useProfileQuery()
	const nicheAccess = useActiveNicheAccess()
	const resultQuery = useDiagnosticResultQuery(cycleId, phase)

	const isAdmin = resolveIsAdmin({
		profileRole: profileQuery.data?.role,
		appMetadataRole: auth.user?.app_metadata?.role,
		userMetadataRole: auth.user?.user_metadata?.role,
		email: auth.user?.email,
	})

	if (
		auth.isLoading ||
		profileQuery.isLoading ||
		nicheAccess.isLoading ||
		resultQuery.isLoading
	) {
		return (
			<main className="grid min-h-dvh place-items-center">
				<Loader2 className="size-6 animate-spin text-primary" />
			</main>
		)
	}

	if (resultQuery.error || !resultQuery.data) {
		return (
			<main className="min-h-dvh">
				<DashboardHeader
					name={profileQuery.data?.fullName ?? 'Usuário'}
					isAdmin={isAdmin}
					avatarUrl={profileQuery.data?.avatarUrl ?? null}
				/>
				<section className="cortex-container py-8">
					<Card className="rounded-3xl border-red-500/30 bg-red-500/10">
						<CardHeader>
							<CardTitle>Resultado indisponível</CardTitle>
							<CardDescription>
								Não foi possível carregar o detalhamento solicitado.
							</CardDescription>
						</CardHeader>
					</Card>
				</section>
			</main>
		)
	}

	const { data } = resultQuery
	const result = data.result
	const generalMaturity =
		result.kind === 'phase1'
			? classifyGeneralStructure(result.generalIndex)
			: classifyPhase2Refined(result.generalIndex)

	return (
		<main className="min-h-dvh pb-12">
			<DashboardHeader
				name={profileQuery.data?.fullName ?? 'Usuário'}
				isAdmin={isAdmin}
				avatarUrl={profileQuery.data?.avatarUrl ?? null}
			/>

			<section className="cortex-container space-y-7 py-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="space-y-3">
						<Link
							href="/dashboard"
							className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<ArrowLeft className="size-4" />
							Voltar para a dashboard
						</Link>
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">{data.nicheName}</Badge>
								<Badge variant="secondary">Ciclo {data.cycleNumber}</Badge>
								<Badge variant="default">{data.phaseLabel}</Badge>
							</div>
							<h1 className="font-(--font-space) text-3xl tracking-tight">
								Resultado Completo {data.phaseLabel}
							</h1>
							<p className="max-w-3xl text-sm text-muted-foreground">
								Leitura do diagnóstico com interpretação, indicadores visuais e
								pontos prioritários de ação.
							</p>
						</div>
					</div>
					<Card className="min-w-[260px] rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg">
						<CardContent className="space-y-1 p-5 text-center">
							<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
								Concluído em
							</p>
							<p className="text-base font-semibold">
								{formatDate(data.completedAt)}
							</p>
						</CardContent>
					</Card>
				</div>

				<Card
					className="rounded-4xl border-border/70 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,var(--card))_0%,color-mix(in_oklch,var(--accent)_8%,var(--card))_100%)] backdrop-blur-xl shadow-[0_18px_48px_rgba(2,8,23,0.14)]"
					style={
						result.kind === 'phase2'
							? getPhase2ExecutiveCardStyle(generalMaturity.level)
							: undefined
					}
				>
					<CardContent className="grid gap-6 p-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-primary">
								<Sparkles className="size-4" />
								<span className="text-xs font-semibold uppercase tracking-[0.16em]">
									Leitura Executiva
								</span>
							</div>
							<h2 className="font-(--font-space) text-2xl tracking-tight">
								{result.kind === 'phase1'
									? 'Diagnóstico Estrutural Consolidado'
									: `Avaliação Aprofundada de ${pillarTitle(result.criticalPillar)}`}
							</h2>
							<p className="max-w-3xl text-sm leading-7 text-foreground/78">
								{result.overviewText}
							</p>
							{result.kind === 'phase2' ? (
								<div className="rounded-2xl border border-border/60 bg-background/35 p-4">
									<p className="text-sm leading-6 text-foreground/80">
										{generalMaturity.label}: {result.overviewText}
									</p>
									<div className="mt-3 flex items-center gap-3">
										<div className="h-3 flex-1 rounded-full bg-secondary/70">
											<div
												className="h-full rounded-full transition-all duration-500"
												style={{
													width: `${Math.max(0, Math.min(100, result.generalIndex))}%`,
													background:
														'linear-gradient(90deg, color-mix(in oklch, var(--tertiary) 88%, white) 0%, var(--tertiary) 100%)',
													boxShadow:
														'0 0 16px color-mix(in oklch, var(--tertiary) 24%, transparent)',
												}}
											/>
										</div>
										<span className="text-sm font-semibold">
											{result.generalIndex}%
										</span>
									</div>
								</div>
							) : null}
						</div>
						<div className="lg:justify-self-end">
							<Card className="w-full min-w-[240px] rounded-3xl border-border/70 bg-background/60 text-center backdrop-blur-lg">
								<CardContent className="space-y-2 p-5">
									<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
										Índice Geral
									</p>
									<p className="text-5xl font-bold">{result.generalIndex}%</p>
									<p className="text-base font-semibold text-foreground">
										{generalMaturity.label}
									</p>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>

				{result.kind === 'phase1' ? (
					<div className="grid gap-4 lg:grid-cols-2">
						<div
							className="rounded-3xl border p-5"
							style={getPillarOutcomeCardStyle('strong')}
						>
							<p
								className="text-xs uppercase tracking-[0.16em]"
								style={getPillarOutcomeLabelStyle('strong')}
							>
								Pilar Forte
							</p>
							<div className="mt-3 flex items-center justify-between gap-4">
								<p className="text-2xl font-semibold tracking-tight text-foreground">
									{pillarTitle(result.strongPillar)}
								</p>
								<div className="flex size-16 shrink-0 items-center justify-center">
									<Trophy
										size={64}
										style={getPillarOutcomeLabelStyle('strong')}
									/>
								</div>
							</div>
							<p className="mt-2 text-sm leading-6 text-foreground/78">
								{getStrongPillarDescription(
									result.strongPillar,
									result.pillarItems.find(
										(item) => item.key === result.strongPillar,
									)?.value ?? 0,
								)}
							</p>
						</div>
						<div
							className="rounded-3xl border p-5"
							style={getPillarOutcomeCardStyle('critical')}
						>
							<p
								className="text-xs uppercase tracking-[0.16em]"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Pilar Crítico
							</p>
							<div className="mt-3 flex items-center justify-between gap-4">
								<p className="text-2xl font-semibold tracking-tight text-foreground">
									{pillarTitle(result.criticalPillar)}
								</p>
								<div className="flex size-16 shrink-0 items-center justify-center">
									<AlertTriangle
										size={64}
										style={getPillarOutcomeLabelStyle('critical')}
									/>
								</div>
							</div>
							<p className="mt-2 text-sm leading-6 text-foreground/78">
								{getCriticalPillarDescription(
									result.criticalPillar,
									result.pillarItems.find(
										(item) => item.key === result.criticalPillar,
									)?.value ?? 0,
								)}
							</p>
						</div>
					</div>
				) : null}

				<div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
					<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
						<CardHeader className="p-6 pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<BarChart3 className="size-4 text-primary" />
								{result.kind === 'phase1'
									? 'Força relativa dos pilares'
									: 'Comparativo técnico e estado atual'}
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 pt-2">
							<DetailBarChart
								items={
									result.kind === 'phase1'
										? result.pillarItems.map((item) => ({
												label: item.title,
												value: item.value,
												colorToken: item.colorToken,
												description: item.summary,
											}))
										: result.metrics
								}
							/>
						</CardContent>
					</Card>

					<DetailDonutChart
						title={
							result.kind === 'phase1'
								? 'Distribuição estrutural'
								: 'Peso relativo dos índices'
						}
						segments={result.donutSegments}
					/>
				</div>

				{result.kind === 'phase2' ? (
					<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
						{result.stateBlocks.map((block) => (
							<Card
								key={block.id}
								className="rounded-3xl border bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]"
								style={getStateBlockStyle(block.level)}
							>
								<CardHeader className="space-y-3 p-6 pb-3">
									<div className="flex items-center justify-between gap-3">
										<CardTitle className="text-base">{block.title}</CardTitle>
										<span className="text-sm font-semibold">
											{block.value}%
										</span>
									</div>
									<div
										className={cn(
											'inline-flex w-fit items-center gap-2 rounded-full border border-current/35 bg-black/10 px-2.5 py-1 text-xs font-semibold',
											getStateBlockLabelClass(block.level),
										)}
									>
										<span className="size-1.5 rounded-full bg-current" />
										{getStateBlockLabel(block.level)}
									</div>
								</CardHeader>
								<CardContent className="p-6 pt-2">
									<p className="text-sm leading-6 text-foreground/82">
										{block.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				) : null}

				{result.kind === 'phase1' ? (
					<div className="grid gap-5 xl:grid-cols-3">
						{result.structuralInsights.map((insight) => {
							const InsightIcon = getStructuralInsightIcon(insight.id)

							return (
								<Card
									key={insight.id}
									className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]"
								>
									<CardHeader className="p-6 pb-3">
										<CardDescription>{insight.valueLabel}</CardDescription>
										<CardTitle className="flex items-center gap-2 text-lg">
											<InsightIcon className="size-4 text-primary" />
											{insight.title}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 p-6 pt-2">
										<p className="text-base font-semibold text-foreground">
											{insight.status}
										</p>
										<p className="text-sm leading-7 text-foreground/78">
											{insight.description}
										</p>
									</CardContent>
								</Card>
							)
						})}
					</div>
				) : (
					<Card
						className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]"
						style={getPillarOutcomeCardStyle('critical')}
					>
						<CardHeader className="p-6 pb-3">
							<CardDescription>Leitura consolidada por padrões</CardDescription>
							<CardTitle
								className="text-lg"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Padrões técnicos prioritários
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 p-6 pt-2">
							{result.technicalPatterns.length === 0 ? (
								<div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
									Nenhum padrão técnico crítico foi identificado nesta fase.
								</div>
							) : (
								result.technicalPatterns.map((pattern) => (
									<div
										key={pattern.id}
										className="rounded-2xl border p-4"
										style={getTechnicalPatternStyle(pattern.severity)}
									>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<p
												className={cn(
													'text-sm font-semibold uppercase tracking-[0.12em]',
													getTechnicalPatternTitleClass(pattern.severity),
												)}
											>
												{pattern.title}
											</p>
											<Badge
												className={cn(
													'rounded-full',
													getTechnicalPatternBadgeClass(pattern.severity),
												)}
											>
												{pattern.lowScoreCount}{' '}
												{pattern.lowScoreCount === 1
													? 'sinal crítico'
													: 'sinais críticos'}
											</Badge>
										</div>
										<p className="mt-1 text-xs font-medium text-foreground/70">
											{getTechnicalPatternSeverityLabel(pattern.severity)} ·{' '}
											{pattern.lowScoreCount}/{pattern.questionCount} pontos do
											padrão
										</p>
										<p className="mt-2 text-sm leading-6 text-foreground/78">
											{pattern.description}
										</p>
									</div>
								))
							)}
						</CardContent>
					</Card>
				)}

				<div className="flex justify-center pt-2">
					<Link
						href="/dashboard"
						className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<ArrowLeft className="size-4" />
						Voltar para a dashboard
					</Link>
				</div>
			</section>
		</main>
	)
}
