'use client'

import { classifyMaturity } from '@cortex/shared/domain/diagnostic-calculations'
import { Badge } from '@cortex/ui/components/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import {
	ArrowLeft,
	BarChart3,
	CheckCircle2,
	Loader2,
	PieChart,
	Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useProfileQuery } from '@/features/auth/hooks/use-profile-query'
import { resolveIsAdmin } from '@/features/auth/lib/role'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
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
		{items.map((item) => (
			<div key={item.label} className="space-y-1.5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-sm font-semibold">{item.label}</p>
						{item.description ? (
							<p className="text-xs text-muted-foreground">
								{item.description}
							</p>
						) : null}
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
		))}
	</div>
)

const DetailDonutChart = ({
	title,
	description,
	segments,
}: {
	title: string
	description: string
	segments: Array<{
		label: string
		value: number
		colorToken: string
	}>
}) => (
	<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
		<CardHeader className="p-6 pb-3">
			<CardDescription>{description}</CardDescription>
			<CardTitle className="flex items-center gap-2 text-lg">
				<PieChart className="size-4 text-primary" />
				{title}
			</CardTitle>
		</CardHeader>
		<CardContent className="flex flex-col gap-6 p-6 pt-2 lg:flex-row lg:items-center">
			<div
				className="relative mx-auto size-44 rounded-full"
				style={{
					background: buildDonutBackground(
						segments.map((segment) => ({
							value: segment.value,
							color: `var(--${segment.colorToken})`,
						})),
					),
				}}
			>
				<div className="absolute inset-5 rounded-full bg-card/95 backdrop-blur-lg" />
			</div>

			<div className="grid flex-1 gap-3">
				{segments.map((segment) => (
					<div
						key={segment.label}
						className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/55 px-4 py-3"
					>
						<div className="flex items-center gap-3">
							<span
								className="size-3 rounded-full"
								style={{ background: `var(--${segment.colorToken})` }}
							/>
							<span className="text-sm font-medium">{segment.label}</span>
						</div>
						<span className="text-sm font-semibold">{segment.value}%</span>
					</div>
				))}
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
	const generalMaturity = classifyMaturity(result.generalIndex)

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
								Leitura aprofundada do diagnóstico com interpretação,
								indicadores visuais e pontos prioritários de ação.
							</p>
						</div>
					</div>
					<Card className="min-w-[260px] rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg">
						<CardContent className="space-y-1 p-5">
							<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
								Concluído em
							</p>
							<p className="text-base font-semibold">
								{formatDate(data.completedAt)}
							</p>
						</CardContent>
					</Card>
				</div>

				<Card className="rounded-4xl border-border/70 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,var(--card))_0%,color-mix(in_oklch,var(--accent)_8%,var(--card))_100%)] backdrop-blur-xl shadow-[0_18px_48px_rgba(2,8,23,0.14)]">
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
									? 'Diagnóstico estrutural consolidado'
									: `Avaliação aprofundada de ${pillarTitle(result.criticalPillar)}`}
							</h2>
							<p className="max-w-3xl text-sm leading-7 text-foreground/78">
								{result.overviewText}
							</p>
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
								Forte
							</p>
							<p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
								{pillarTitle(result.strongPillar)}
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
								Crítico
							</p>
							<p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
								{pillarTitle(result.criticalPillar)}
							</p>
						</div>
					</div>
				) : (
					<Card
						className="rounded-3xl border-border/70 bg-background/60 backdrop-blur-lg"
						style={getPillarOutcomeCardStyle('critical')}
					>
						<CardContent className="space-y-2 p-5">
							<p
								className="text-xs uppercase tracking-[0.14em]"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Leitura refinada
							</p>
							<p
								className="text-sm font-semibold"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Pilar crítico: {pillarTitle(result.criticalPillar)}
							</p>
							<p
								className="text-sm font-semibold"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Pontos críticos: {result.criticalPoints.length}
							</p>
						</CardContent>
					</Card>
				)}

				<div className="grid gap-5 xl:grid-cols-2">
					<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
						<CardHeader className="p-6 pb-3">
							<CardDescription>Gráfico de barras</CardDescription>
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
												description: `${item.questionCount} perguntas neste pilar`,
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
						description={
							result.kind === 'phase1'
								? 'Comparação proporcional entre os quatro pilares.'
								: 'Relação entre técnica e estado atual na leitura aprofundada.'
						}
						segments={result.donutSegments}
					/>
				</div>

				{result.kind === 'phase1' ? (
					<div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
						<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
							<CardHeader className="p-6 pb-3">
								<CardDescription>Interpretação detalhada</CardDescription>
								<CardTitle className="text-lg">
									Leitura pilar por pilar
								</CardTitle>
							</CardHeader>
							<CardContent className="grid gap-4 p-6 pt-2">
								{result.pillarItems.map((item) => (
									<div
										key={item.key}
										className="rounded-2xl border p-4"
										style={{
											borderColor: `color-mix(in oklch, var(--${item.colorToken}) 44%, transparent)`,
											background: `linear-gradient(145deg, color-mix(in oklch, var(--${item.colorToken}) 10%, var(--card)) 0%, color-mix(in oklch, var(--${item.colorToken}) 4%, var(--card)) 100%)`,
										}}
									>
										<div className="flex items-center justify-between gap-3">
											<p className="font-semibold">{item.title}</p>
											<span className="text-sm font-semibold">
												{item.value}%
											</span>
										</div>
										<p className="mt-2 text-sm text-foreground/78">
											{item.summary}
										</p>
									</div>
								))}
							</CardContent>
						</Card>

						<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
							<CardHeader className="p-6 pb-3">
								<CardDescription>Distribuição das respostas</CardDescription>
								<CardTitle className="text-lg">Escala 1 a 6</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 p-6 pt-2">
								{result.answerDistribution.map((item) => (
									<div
										key={item.value}
										className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3"
									>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												Resposta {item.value}
											</span>
											<span className="text-sm font-semibold">
												{item.total}
											</span>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				) : (
					<Card
						className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]"
						style={getPillarOutcomeCardStyle('critical')}
					>
						<CardHeader className="p-6 pb-3">
							<CardDescription>Diagnóstico ponto a ponto</CardDescription>
							<CardTitle
								className="text-lg"
								style={getPillarOutcomeLabelStyle('critical')}
							>
								Pontos críticos identificados
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 p-6 pt-2">
							{result.criticalPoints.length === 0 ? (
								<div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
									Nenhum ponto crítico foi identificado nesta fase.
								</div>
							) : (
								result.criticalPoints.map((point) => (
									<div
										key={point.id}
										className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4"
									>
										<div className="flex flex-wrap items-center gap-2">
											<Badge
												className={cn(
													'rounded-full',
													point.questionType === 'technical'
														? 'bg-primary text-primary-foreground'
														: 'bg-accent text-accent-foreground',
												)}
											>
												{point.questionType === 'technical'
													? 'Técnico'
													: 'Estado atual'}
											</Badge>
											<span className="text-sm font-semibold">
												Nota {point.score}
											</span>
										</div>
										<p className="mt-3 font-semibold">{point.title}</p>
										<p className="mt-2 text-sm leading-6 text-foreground/78">
											{point.diagnosis}
										</p>
									</div>
								))
							)}
						</CardContent>
					</Card>
				)}

				<Card className="rounded-3xl border-border/70 bg-card/78 backdrop-blur-lg shadow-[0_10px_30px_rgba(2,8,23,0.08)]">
					<CardHeader className="p-6 pb-3">
						<CardDescription>Recomendação de leitura</CardDescription>
						<CardTitle className="flex items-center gap-2 text-lg">
							<CheckCircle2 className="size-4 text-primary" />
							Próxima decisão orientada
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 p-6 pt-2 text-sm leading-7 text-foreground/78">
						{result.kind === 'phase1' ? (
							<>
								<p>
									Use {pillarTitle(result.criticalPillar)} como prioridade do
									plano de correção. O ganho estrutural mais rápido virá do
									fortalecimento do pilar mais frágil.
								</p>
								<p>
									{pillarTitle(result.strongPillar)} deve ser tratado como
									alavanca. Ele é o melhor ponto para sustentar disciplina,
									clareza ou organização enquanto os ajustes centrais são
									feitos.
								</p>
							</>
						) : (
							<>
								<p>
									A fase aprofundada indica onde o problema deixa de ser
									genérico e passa a ser operacional. Os pontos críticos
									listados acima devem orientar o protocolo e as próximas
									intervenções.
								</p>
								<p>
									Quanto menor a diferença entre técnica e estado atual, mais o
									avanço dependerá de correção sistêmica. Quanto maior a
									diferença, mais o plano deve atacar o eixo mais baixo
									primeiro.
								</p>
							</>
						)}
					</CardContent>
				</Card>
			</section>
		</main>
	)
}
