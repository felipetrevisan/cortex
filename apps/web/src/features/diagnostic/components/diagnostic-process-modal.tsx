'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import { PILLARS } from '@cortex/shared/constants/pillars'
import { classifyMaturity } from '@cortex/shared/domain/diagnostic-calculations'
import { Button } from '@cortex/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { cn } from '@cortex/ui/lib/cn'
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Circle,
	Eye,
	Loader2,
	Lock,
	Sparkles,
	X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IconButton } from '@/components/animate-ui/components/buttons/icon'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useDiagnosticProcessFlow } from '../hooks/use-diagnostic-process-flow'

interface DiagnosticProcessModalProps {
	open: boolean
	onOpenChange: (nextOpen: boolean) => void
}

interface ReflectionFormValues {
	reflections: string[]
}

const pillarLabel = (pillar: PillarKey | null): string => {
	if (!pillar) return '-'
	return PILLARS.find((item) => item.key === pillar)?.title ?? pillar
}

const formatDate = (value: Date | null): string => {
	if (!value) return '-'
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(value)
}

const stageTitleMap: Record<string, string> = {
	phase1: 'Fase 1 - Diagnóstico estrutural',
	'phase1-tie': 'Resultado estrutural - Desempate',
	'phase1-result': 'Resumo Resultado Fase 1',
	phase2: 'Fase 2 - Diagnóstico refinado',
	'phase2-result': 'Resumo Resultado Fase 2',
	'protocol-reflections': 'Protocolo de ação - Reflexões',
	'protocol-actions': 'Protocolo de ação - Execução',
	'blocked-45': 'Reavaliação bloqueada',
	'blocked-90': 'Novo ciclo bloqueado',
	completed: 'Ciclo concluído',
}

const resolveStageTitle = (
	flow: ReturnType<typeof useDiagnosticProcessFlow>,
	resultDetailStage: 'phase1' | 'phase2' | null = null,
) => {
	if (resultDetailStage === 'phase1' && flow.stage === 'phase1-result') {
		return {
			eyebrow: 'Resultado completo',
			title: 'Resumo Resultado Fase 1',
		}
	}

	if (resultDetailStage === 'phase2' && flow.stage === 'phase2-result') {
		return {
			eyebrow: 'Resultado completo',
			title: 'Resumo Resultado Fase 2',
		}
	}

	if (flow.stage === 'phase1') {
		return {
			eyebrow: `Pilar ${flow.phase1.currentPillarIndex} de ${flow.phase1.totalPillars}`,
			title: flow.phase1.currentPillarTitle ?? 'Diagnóstico estrutural',
		}
	}

	return {
		eyebrow: null,
		title: stageTitleMap[flow.stage] ?? 'Diagnóstico comportamental',
	}
}

interface CircularGradientProgressProps {
	value: number
	size?: number
	strokeWidth?: number
	colorToken?: string
}

const CircularGradientProgress = ({
	value,
	size = 74,
	strokeWidth = 6,
	colorToken = 'primary',
}: CircularGradientProgressProps) => {
	const reducedMotion = useReducedMotion()
	const progress = Math.max(0, Math.min(100, Math.round(value)))

	const radius = (size - strokeWidth) / 2
	const circumference = 2 * Math.PI * radius
	const dashOffset = circumference * (1 - progress / 100)
	const center = size / 2
	const strokeColor = `var(--${colorToken})`

	return (
		<div className="relative grid place-items-center">
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="-rotate-90"
				aria-hidden="true"
			>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke="color-mix(in oklch, var(--border) 78%, transparent)"
					strokeWidth={strokeWidth}
				/>
				<motion.circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					initial={false}
					animate={{ strokeDashoffset: dashOffset }}
					transition={
						reducedMotion
							? { duration: 0 }
							: { type: 'spring', stiffness: 160, damping: 22, mass: 0.45 }
					}
				/>
			</svg>

			<span className="absolute text-sm font-bold tabular-nums text-foreground">
				{progress}%
			</span>
		</div>
	)
}

const resolveActivePillar = (
	flow: ReturnType<typeof useDiagnosticProcessFlow>,
): PillarKey | null => {
	if (flow.stage === 'phase1') {
		return flow.phase1.currentPillarKey
	}

	if (flow.stage === 'phase2' || flow.stage === 'phase2-result') {
		return flow.phase2.criticalPillar
	}

	if (
		flow.stage === 'phase1-tie' ||
		flow.stage === 'phase1-result' ||
		flow.stage === 'protocol-reflections' ||
		flow.stage === 'protocol-actions' ||
		flow.stage === 'completed' ||
		flow.stage === 'blocked-45' ||
		flow.stage === 'blocked-90'
	) {
		return (
			flow.tieBreak.selectedCriticalPillar ??
			flow.phase1Summary?.criticalPillar ??
			flow.phase2.criticalPillar
		)
	}

	return null
}

const resolveProgressColorToken = (
	flow: ReturnType<typeof useDiagnosticProcessFlow>,
) => {
	const activePillar = resolveActivePillar(flow)
	if (!activePillar) return 'primary'

	return (
		PILLARS.find((pillar) => pillar.key === activePillar)?.colorToken ??
		'primary'
	)
}

const getPillarColorToken = (pillar: PillarKey | null) =>
	PILLARS.find((item) => item.key === pillar)?.colorToken ?? 'primary'

const getPillarSummaryStyle = (pillar: PillarKey | null): CSSProperties => {
	const colorToken = getPillarColorToken(pillar)

	return {
		borderColor: `color-mix(in oklch, var(--${colorToken}) 40%, transparent)`,
		background: `linear-gradient(145deg, color-mix(in oklch, var(--${colorToken}) 16%, var(--card)) 0%, color-mix(in oklch, var(--${colorToken}) 6%, var(--card)) 100%)`,
		boxShadow: `0 0 24px color-mix(in oklch, var(--${colorToken}) 18%, transparent)`,
	}
}

const getPillarSummaryLabelStyle = (
	pillar: PillarKey | null,
): CSSProperties => {
	const colorToken = getPillarColorToken(pillar)

	return {
		color: `color-mix(in oklch, var(--${colorToken}) 78%, var(--foreground))`,
	}
}

export const DiagnosticProcessModal = ({
	open,
	onOpenChange,
}: DiagnosticProcessModalProps) => {
	const flow = useDiagnosticProcessFlow(open)
	const [resultDetailStage, setResultDetailStage] = useState<
		'phase1' | 'phase2' | null
	>(null)
	const reflectionForm = useForm<ReflectionFormValues>({
		defaultValues: {
			reflections: ['', '', '', '', ''],
		},
	})

	useEffect(() => {
		reflectionForm.reset({
			reflections: flow.protocol.reflections,
		})
	}, [flow.protocol.reflections, reflectionForm])

	useEffect(() => {
		if (
			(flow.stage !== 'phase1-result' && resultDetailStage === 'phase1') ||
			(flow.stage !== 'phase2-result' && resultDetailStage === 'phase2')
		) {
			setResultDetailStage(null)
		}
	}, [flow.stage, resultDetailStage])

	useEffect(() => {
		if (!open && resultDetailStage) {
			setResultDetailStage(null)
		}
	}, [open, resultDetailStage])

	const progressPercent = useMemo(() => {
		if (
			flow.stage === 'phase1' ||
			flow.stage === 'phase1-tie' ||
			flow.stage === 'phase1-result'
		) {
			return flow.phase1Progress
		}

		if (flow.stage === 'phase2' || flow.stage === 'phase2-result') {
			return flow.phase2Progress
		}

		if (
			flow.stage === 'protocol-reflections' ||
			flow.stage === 'protocol-actions'
		) {
			return flow.protocolCompletion.percent
		}

		return 100
	}, [
		flow.phase1Progress,
		flow.phase2Progress,
		flow.protocolCompletion.percent,
		flow.stage,
	])

	const onSubmitReflections = reflectionForm.handleSubmit(async (values) => {
		await flow.saveProtocolReflections(values.reflections)
	})

	const progressColorToken = resolveProgressColorToken(flow)
	const stageTitle = resolveStageTitle(flow, resultDetailStage)
	const phase1HighlightCards = [
		{
			id: 'strong',
			label: 'Pilar forte',
			pillar: flow.phase1Summary?.strongPillar ?? null,
		},
		{
			id: 'critical',
			label: 'Pilar crítico',
			pillar: flow.phase1Summary?.criticalPillar ?? null,
		},
	] as const
	const isShowingPhase1DetailedResult =
		flow.stage === 'phase1-result' && resultDetailStage === 'phase1'
	const isShowingPhase2DetailedResult =
		flow.stage === 'phase2-result' && resultDetailStage === 'phase2'

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (flow.isSaving && !nextOpen) return
				onOpenChange(nextOpen)
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="w-full max-w-3xl border-0 bg-transparent p-0 shadow-none backdrop-blur-0"
				onPointerDownOutside={(event) => {
					if (flow.isSaving) {
						event.preventDefault()
					}
				}}
				onEscapeKeyDown={(event) => {
					if (flow.isSaving) {
						event.preventDefault()
					}
				}}
			>
				<Card className="overflow-hidden rounded-3xl border-border/75 bg-card shadow-[0_20px_50px_rgba(2,8,23,0.28)]">
					<CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-6">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<CardDescription className="text-[11px] uppercase tracking-[0.12em]">
									Cortex System - Diagnóstico Estrutural
								</CardDescription>

								{stageTitle.eyebrow ? (
									<CardDescription className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
										{stageTitle.eyebrow}
									</CardDescription>
								) : null}

								<CardTitle className="font-[var(--font-space)] text-xl">
									{stageTitle.title}
								</CardTitle>
							</div>

							<div className="flex items-center gap-3">
								<CircularGradientProgress
									value={progressPercent}
									colorToken={progressColorToken}
								/>
								<IconButton
									variant="ghost"
									size="sm"
									aria-label="Fechar modal"
									className="cursor-pointer"
									onClick={() => onOpenChange(false)}
									disabled={flow.isSaving}
								>
									<X className="size-4" />
								</IconButton>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6 p-6">
						{flow.isInitializing ? (
							<div className="grid min-h-[240px] place-items-center">
								<Loader2 className="size-6 animate-spin text-primary" />
							</div>
						) : (
							<>
								{flow.errorMessage ? (
									<p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
										{flow.errorMessage}
									</p>
								) : null}

								{flow.stage === 'phase1' ? (
									<div className="space-y-6">
										<div className="space-y-2">
											<p className="text-xl font-medium leading-relaxed">
												{flow.phase1.currentQuestion}
											</p>
										</div>

										<div className="grid gap-3 sm:grid-cols-2">
											{flow.currentPhase1Options.map((option) => (
												<Button
													key={`phase1:${option.value}:${option.label}`}
													variant="outline"
													className={cn(
														'h-16 justify-start rounded-2xl border-border/75 px-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8',
														flow.isSaving ? 'opacity-70' : '',
													)}
													disabled={flow.isSaving}
													onClick={() => flow.savePhase1Answer(option.value)}
												>
													<span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
														{option.value}
													</span>
													<span className="ml-3 text-sm font-medium">
														{option.label}
													</span>
												</Button>
											))}
										</div>
									</div>
								) : null}

								{flow.stage === 'phase1-tie' ? (
									<div className="space-y-6">
										<div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm">
											Empate detectado. Selecione manualmente os pilares para
											continuar.
										</div>

										{flow.tieBreak.criticalCandidates.length > 1 ? (
											<div className="space-y-3">
												<h4 className="font-semibold">
													Escolha o pilar crítico
												</h4>
												<div className="grid gap-3 sm:grid-cols-2">
													{flow.tieBreak.criticalCandidates.map((pillar) => (
														<Button
															key={`critical:${pillar}`}
															variant="outline"
															className={cn(
																'h-12 justify-start rounded-2xl px-4',
																flow.tieBreak.selectedCriticalPillar === pillar
																	? 'border-primary bg-primary/10'
																	: '',
															)}
															onClick={() =>
																flow.setSelectedCriticalPillar(pillar)
															}
														>
															{pillarLabel(pillar)}
														</Button>
													))}
												</div>
											</div>
										) : null}

										{flow.tieBreak.strongCandidates.length > 1 ? (
											<div className="space-y-3">
												<h4 className="font-semibold">Escolha o pilar forte</h4>
												<div className="grid gap-3 sm:grid-cols-2">
													{flow.tieBreak.strongCandidates.map((pillar) => (
														<Button
															key={`strong:${pillar}`}
															variant="outline"
															className={cn(
																'h-12 justify-start rounded-2xl px-4',
																flow.tieBreak.selectedStrongPillar === pillar
																	? 'border-primary bg-primary/10'
																	: '',
															)}
															onClick={() =>
																flow.setSelectedStrongPillar(pillar)
															}
														>
															{pillarLabel(pillar)}
														</Button>
													))}
												</div>
											</div>
										) : null}

										<Button
											className="h-11 rounded-2xl"
											disabled={flow.isSaving}
											onClick={flow.resolveTieBreak}
										>
											Confirmar desempate
										</Button>
									</div>
								) : null}

								{flow.stage === 'phase1-result' ? (
									<div className="space-y-6">
										{isShowingPhase1DetailedResult ? (
											<>
												<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
													<div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-lg">
														<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
															Índice geral estrutural
														</p>
														<p className="mt-2 text-4xl font-bold">
															{flow.phase1Summary?.generalIndex ?? 0}%
														</p>
														<p className="mt-3 text-sm text-muted-foreground">
															Leitura consolidada dos quatro pilares que
															sustentam a conclusão do projeto.
														</p>
													</div>

													<div className="grid gap-3">
														{phase1HighlightCards.map((item) => (
															<div
																key={item.id}
																className="rounded-2xl border p-4"
																style={getPillarSummaryStyle(item.pillar)}
															>
																<p
																	className="text-xs uppercase tracking-[0.16em]"
																	style={getPillarSummaryLabelStyle(
																		item.pillar,
																	)}
																>
																	{item.label}
																</p>
																<p className="mt-2 text-xl font-semibold tracking-tight">
																	{pillarLabel(item.pillar)}
																</p>
															</div>
														))}
													</div>
												</div>

												<div className="grid gap-3 sm:grid-cols-2">
													{PILLARS.map((pillar) => {
														const value =
															flow.phase1Summary?.pillarPercentages[
																pillar.key
															] ?? 0
														const maturity = classifyMaturity(value)

														return (
															<div
																key={pillar.key}
																className="rounded-2xl border p-4"
																style={getPillarSummaryStyle(pillar.key)}
															>
																<p
																	className="text-xs uppercase tracking-[0.14em]"
																	style={getPillarSummaryLabelStyle(pillar.key)}
																>
																	{maturity.label}
																</p>
																<p className="mt-2 text-lg font-semibold">
																	{pillar.title}
																</p>
																<p className="mt-2 text-3xl font-bold">
																	{value}%
																</p>
																<p className="mt-2 text-sm text-foreground/78">
																	{maturity.description}
																</p>
															</div>
														)
													})}
												</div>

												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<Button
														variant="outline"
														className="h-11 rounded-2xl"
														onClick={() => setResultDetailStage(null)}
													>
														<ArrowLeft className="size-4" />
														Voltar ao resumo
													</Button>

													<Button
														className="h-11 rounded-2xl"
														onClick={flow.startPhase2}
													>
														Próximo Nível
														<ArrowRight className="size-4" />
													</Button>
												</div>
											</>
										) : (
											<>
												<div className="grid gap-4 sm:grid-cols-2">
													{phase1HighlightCards.map((item) => (
														<div
															key={item.id}
															className="rounded-2xl border p-5"
															style={getPillarSummaryStyle(item.pillar)}
														>
															<p
																className="text-xs uppercase tracking-[0.16em]"
																style={getPillarSummaryLabelStyle(item.pillar)}
															>
																{item.label}
															</p>
															<p className="mt-3 text-2xl font-semibold tracking-tight">
																{pillarLabel(item.pillar)}
															</p>
														</div>
													))}
												</div>

												<div className="grid gap-3 sm:grid-cols-2">
													{PILLARS.map((pillar) => {
														const value =
															flow.phase1Summary?.pillarPercentages[
																pillar.key
															] ?? 0
														const maturity = classifyMaturity(value)

														return (
															<div
																key={pillar.key}
																className="rounded-2xl border border-border/70 bg-card p-4"
															>
																<p className="text-sm font-semibold">
																	{pillar.title}
																</p>
																<p className="mt-1 text-2xl font-bold">
																	{value}%
																</p>
																<p className="mt-1 text-xs text-muted-foreground">
																	{maturity.label} - {maturity.description}
																</p>
															</div>
														)
													})}
												</div>

												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<Button
														variant="outline"
														className="h-11 rounded-2xl"
														onClick={() => setResultDetailStage('phase1')}
													>
														<Eye className="size-4" />
														Acessar Resultado Completo
													</Button>

													<Button
														className="h-11 rounded-2xl"
														onClick={flow.startPhase2}
													>
														Próximo Nível
														<ArrowRight className="size-4" />
													</Button>
												</div>
											</>
										)}
									</div>
								) : null}

								{flow.stage === 'phase2' ? (
									<div className="space-y-6">
										<div className="space-y-2">
											<p className="text-xl font-medium leading-relaxed">
												{flow.phase2.currentQuestion?.title}
											</p>
										</div>

										<div className="grid gap-3 sm:grid-cols-2">
											{flow.phase2.currentOptions.map((option) => (
												<Button
													key={`phase2:${option.value}:${option.label}`}
													variant="outline"
													className={cn(
														'h-16 justify-start rounded-2xl border-border/75 px-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8',
														flow.isSaving ? 'opacity-70' : '',
													)}
													disabled={flow.isSaving}
													onClick={() => flow.savePhase2Answer(option.value)}
												>
													<span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
														{option.value}
													</span>
													<span className="ml-3 text-sm font-medium">
														{option.label}
													</span>
												</Button>
											))}
										</div>
									</div>
								) : null}

								{flow.stage === 'phase2-result' ? (
									<div className="space-y-6">
										{isShowingPhase2DetailedResult ? (
											<>
												<div
													className="rounded-2xl border p-5"
													style={getPillarSummaryStyle(
														flow.phase2.criticalPillar,
													)}
												>
													<p
														className="text-xs uppercase tracking-[0.14em]"
														style={getPillarSummaryLabelStyle(
															flow.phase2.criticalPillar,
														)}
													>
														Pilar analisado em profundidade
													</p>
													<p className="mt-2 text-2xl font-semibold tracking-tight">
														{pillarLabel(flow.phase2.criticalPillar)}
													</p>
												</div>

												<div className="grid gap-4 sm:grid-cols-3">
													<div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice técnico
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.technicalIndex ?? 0}%
														</p>
													</div>
													<div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice estado atual
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.stateIndex ?? 0}%
														</p>
													</div>
													<div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice geral refinado
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.generalIndex ?? 0}%
														</p>
													</div>
												</div>

												<div className="space-y-3">
													<h4 className="font-semibold">
														Leitura diagnóstica completa
													</h4>
													{flow.criticalPoints.length === 0 ? (
														<p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
															Nenhum ponto crítico identificado nesta etapa.
														</p>
													) : (
														<div className="space-y-3">
															{flow.criticalPoints.map((point) => (
																<div
																	key={point.id}
																	className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
																>
																	<p className="text-sm font-semibold">
																		Nota {point.score} - {point.title}
																	</p>
																	<p className="mt-1 text-sm">
																		{point.diagnosis}
																	</p>
																</div>
															))}
														</div>
													)}
												</div>

												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<Button
														variant="outline"
														className="h-11 rounded-2xl"
														onClick={() => setResultDetailStage(null)}
													>
														<ArrowLeft className="size-4" />
														Voltar ao resumo
													</Button>

													{flow.isReevaluationMode ? (
														<div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-left sm:max-w-sm">
															<p className="font-semibold">
																Reavaliação concluída
															</p>
															<p className="mt-1 text-muted-foreground">
																{
																	flow.temporalRules.newStructuralDiagnosis
																		.message
																}
															</p>
														</div>
													) : (
														<Button
															className="h-11 rounded-2xl"
															onClick={flow.startProtocol}
														>
															Iniciar Protocolo de Ação
															<ArrowRight className="size-4" />
														</Button>
													)}
												</div>
											</>
										) : (
											<>
												<div className="grid gap-4 sm:grid-cols-3">
													<div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice técnico
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.technicalIndex ?? 0}%
														</p>
													</div>
													<div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice estado atual
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.stateIndex ?? 0}%
														</p>
													</div>
													<div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
														<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
															Índice geral refinado
														</p>
														<p className="mt-1 text-2xl font-bold">
															{flow.phase2Summary?.generalIndex ?? 0}%
														</p>
													</div>
												</div>

												<div className="space-y-3">
													<h4 className="font-semibold">
														Pontos críticos (nota menor ou igual a 2)
													</h4>
													{flow.criticalPoints.length === 0 ? (
														<p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
															Nenhum ponto crítico identificado nesta etapa.
														</p>
													) : (
														<div className="space-y-3">
															{flow.criticalPoints.map((point) => (
																<div
																	key={point.id}
																	className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
																>
																	<p className="text-sm font-semibold">
																		Nota {point.score} - {point.title}
																	</p>
																	<p className="mt-1 text-sm">
																		{point.diagnosis}
																	</p>
																</div>
															))}
														</div>
													)}
												</div>

												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<Button
														variant="outline"
														className="h-11 rounded-2xl"
														onClick={() => setResultDetailStage('phase2')}
													>
														<Eye className="size-4" />
														Acessar Resultado Completo
													</Button>

													{flow.isReevaluationMode ? (
														<div className="space-y-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 sm:max-w-sm">
															<p className="text-sm font-semibold">
																Reavaliação concluída
															</p>
															<p className="text-sm">
																{
																	flow.temporalRules.newStructuralDiagnosis
																		.message
																}
															</p>
															<p className="text-xs text-muted-foreground">
																Próximo diagnóstico completo em:{' '}
																{formatDate(
																	flow.temporalRules.newStructuralDiagnosis
																		.availableAt,
																)}
															</p>
														</div>
													) : (
														<Button
															className="h-11 rounded-2xl"
															onClick={flow.startProtocol}
														>
															Iniciar Protocolo de Ação
															<ArrowRight className="size-4" />
														</Button>
													)}
												</div>
											</>
										)}
									</div>
								) : null}

								{flow.stage === 'protocol-reflections' ? (
									<form className="space-y-5" onSubmit={onSubmitReflections}>
										<p className="text-sm text-muted-foreground">
											Responda as 5 perguntas reflexivas para liberar as ações
											práticas.
										</p>

										{flow.protocolMeta.reflectionsPrompts.map(
											(prompt, index) => (
												<div key={`reflection:${prompt}`} className="space-y-2">
													<label
														htmlFor={`reflection-${index}`}
														className="text-sm font-semibold"
													>
														{prompt}
													</label>
													<textarea
														id={`reflection-${index}`}
														rows={3}
														className="w-full resize-none rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
														{...reflectionForm.register(`reflections.${index}`)}
													/>
												</div>
											),
										)}

										<Button
											className="h-11 rounded-2xl"
											type="submit"
											disabled={flow.isSaving}
										>
											Salvar reflexões e continuar
										</Button>
									</form>
								) : null}

								{flow.stage === 'protocol-actions' ? (
									<div className="space-y-6">
										<div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
											<p className="text-sm font-semibold">
												{flow.protocolCompletion.completedActions} /{' '}
												{flow.protocolCompletion.totalActions} ações concluídas
											</p>
										</div>

										<div className="space-y-4">
											{flow.protocolMeta.actionBlocks.map((block) => {
												const actions =
													block.block === 1
														? flow.protocol.block1Actions
														: block.block === 2
															? flow.protocol.block2Actions
															: flow.protocol.block3Actions

												const isUnlocked =
													block.block === 1
														? true
														: block.block === 2
															? flow.protocol.block1Actions.every(Boolean)
															: flow.protocol.block1Actions.every(Boolean) &&
																flow.protocol.block2Actions.every(Boolean)

												return (
													<div
														key={`block:${block.block}`}
														className={cn(
															'rounded-2xl border p-4',
															isUnlocked
																? 'border-border/70 bg-card'
																: 'border-border/50 bg-muted/40',
														)}
													>
														<div className="mb-3 flex items-center gap-2">
															{isUnlocked ? (
																<Sparkles className="size-4 text-primary" />
															) : (
																<Lock className="size-4 text-muted-foreground" />
															)}
															<h4 className="font-semibold">{block.title}</h4>
														</div>

														<div className="space-y-2">
															{block.actions.map((action, actionIndex) => {
																const done = Boolean(actions[actionIndex])
																return (
																	<Button
																		key={`action:${block.block}:${actionIndex}`}
																		variant="outline"
																		className={cn(
																			'h-auto w-full justify-start rounded-xl px-3 py-2 text-left',
																			done
																				? 'border-emerald-500/40 bg-emerald-500/10'
																				: '',
																			!isUnlocked ? 'opacity-60' : '',
																		)}
																		disabled={!isUnlocked || flow.isSaving}
																		onClick={() =>
																			flow.toggleProtocolAction(
																				block.block,
																				actionIndex,
																			)
																		}
																	>
																		{done ? (
																			<CheckCircle2 className="size-4 text-emerald-500" />
																		) : (
																			<Circle className="size-4 text-muted-foreground" />
																		)}
																		<span>{action}</span>
																	</Button>
																)
															})}
														</div>
													</div>
												)
											})}
										</div>
									</div>
								) : null}

								{flow.stage === 'blocked-45' ? (
									<div className="space-y-5 py-4">
										<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
											<p className="text-sm font-semibold">
												{flow.temporalRules.phase2Reevaluation.message}
											</p>
											<p className="mt-2 text-xs text-muted-foreground">
												Data prevista:{' '}
												{formatDate(
													flow.temporalRules.phase2Reevaluation.availableAt,
												)}
											</p>
										</div>
										<Button
											className="h-11 rounded-2xl"
											onClick={() => onOpenChange(false)}
										>
											Entendi
										</Button>
									</div>
								) : null}

								{flow.stage === 'blocked-90' ? (
									<div className="space-y-5 py-4">
										<div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
											<p className="text-sm font-semibold">
												{flow.temporalRules.newStructuralDiagnosis.message}
											</p>
											<p className="mt-2 text-xs text-muted-foreground">
												Data prevista:{' '}
												{formatDate(
													flow.temporalRules.newStructuralDiagnosis.availableAt,
												)}
											</p>
										</div>
										<Button
											className="h-11 rounded-2xl"
											onClick={() => onOpenChange(false)}
										>
											Fechar
										</Button>
									</div>
								) : null}

								{flow.stage === 'completed' ? (
									<div className="space-y-6 py-8 text-center">
										<div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
											<CheckCircle2 className="size-8" />
										</div>
										<h3 className="font-[var(--font-space)] text-2xl">
											Ciclo concluído
										</h3>
										<p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold">
											Protocolo concluído em{' '}
											{formatDate(flow.protocolCompletedAt)}.
										</p>
										<p className="text-muted-foreground">
											Diagnóstico e protocolo finalizados. O histórico e
											relatório comparativo já foram atualizados.
										</p>
										<Button
											className="mx-auto h-11 rounded-2xl"
											onClick={() => onOpenChange(false)}
										>
											Fechar
										</Button>
									</div>
								) : null}
							</>
						)}
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	)
}
