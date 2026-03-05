'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import { PILLARS } from '@cortex/shared/constants/pillars'
import {
	classifyGeneralStructure,
	classifyMaturity,
	classifyPhase2Refined,
} from '@cortex/shared/domain/diagnostic-calculations'
import { Button } from '@cortex/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { Dialog, DialogContent } from '@cortex/ui/components/dialog'
import { Textarea } from '@cortex/ui/components/textarea'
import { cn } from '@cortex/ui/lib/cn'
import {
	ArrowRight,
	CheckCircle2,
	Circle,
	GitCompareArrows,
	Loader2,
	Lock,
	Radar,
	ShieldAlert,
	Sparkles,
	X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IconButton } from '@/components/animate-ui/components/buttons/icon'
import {
	getCriticalPillarDescription,
	getStrongPillarDescription,
} from '@/features/diagnostic/lib/pillar-highlight-copy'
import {
	getPillarOutcomeCardStyle,
	getPillarOutcomeLabelStyle,
	type PillarOutcomeRole,
} from '@/features/diagnostic/lib/pillar-outcome-style'
import {
	buildStructuralInsights,
	getOperationalRiskInsight,
	getPhase1AsymmetryScore,
	getPhase1FinalSummary,
} from '@/features/results/lib/phase1-structural-summary'
import { getDiagnosticResultPath } from '@/features/results/lib/result-routes'
import { useDiagnosticProcessFlow } from '../hooks/use-diagnostic-process-flow'

interface DiagnosticProcessModalProps {
	open: boolean
	onOpenChange: (nextOpen: boolean) => void
}

interface ReflectionFormValues {
	reflections: string[]
}

type InstructionStage = 'phase1' | 'phase2'

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
	phase2: 'Fase 2 - Diagnóstico Aprofundado',
	'phase2-result': 'Resumo Resultado Fase 2',
	'protocol-reflections': 'Protocolo de Ação - Perguntas',
	'protocol-actions': 'Protocolo de Ação - Execução',
	'blocked-45': 'Reavaliação bloqueada',
	'blocked-90': 'Novo ciclo bloqueado',
	completed: 'Ciclo concluído',
}

const resolveStageTitle = (
	flow: ReturnType<typeof useDiagnosticProcessFlow>,
) => {
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
	if (flow.stage === 'phase2') {
		if (flow.phase2.currentQuestion?.questionType === 'state') {
			return 'tertiary'
		}

		if (flow.phase2.currentQuestion?.questionType === 'technical') {
			const technicalPillar = flow.phase2.criticalPillar
			return (
				PILLARS.find((pillar) => pillar.key === technicalPillar)?.colorToken ??
				'primary'
			)
		}
	}

	const activePillar = resolveActivePillar(flow)
	if (!activePillar) return 'primary'

	return (
		PILLARS.find((pillar) => pillar.key === activePillar)?.colorToken ??
		'primary'
	)
}

const getStructuralInsightIcon = (id: 'asymmetry' | 'risk' | 'coherence') => {
	switch (id) {
		case 'asymmetry':
			return GitCompareArrows
		case 'risk':
			return ShieldAlert
		case 'coherence':
			return Radar
	}
}

const responseLevelDescriptions = [
	{
		value: 1,
		label: 'Nunca',
		description: 'Isso não acontece comigo. Não faz parte do meu padrão.',
	},
	{
		value: 2,
		label: 'Raramente',
		description: 'Acontece poucas vezes. Não é frequente.',
	},
	{
		value: 3,
		label: 'Às vezes',
		description: 'Ocorre em algumas situações. Não é constante, mas se repete.',
	},
	{
		value: 4,
		label: 'Frequentemente',
		description:
			'Acontece com regularidade. Já começa a impactar meu desempenho.',
	},
	{
		value: 5,
		label: 'Quase sempre',
		description: 'É um padrão recorrente. Ocorre na maioria das situações.',
	},
	{
		value: 6,
		label: 'Sempre',
		description: 'É um comportamento constante. Faz parte do meu padrão fixo.',
	},
] as const

export const DiagnosticProcessModal = ({
	open,
	onOpenChange,
}: DiagnosticProcessModalProps) => {
	const router = useRouter()
	const flow = useDiagnosticProcessFlow(open)
	const [dismissedInstructions, setDismissedInstructions] = useState<
		Record<InstructionStage, boolean>
	>({
		phase1: false,
		phase2: false,
	})
	const [pendingAnswerKey, setPendingAnswerKey] = useState<string | null>(null)
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
		if (!open) {
			setDismissedInstructions({
				phase1: false,
				phase2: false,
			})
			setPendingAnswerKey(null)
		}
	}, [open])

	const progressPercent = useMemo(() => {
		if (pendingAnswerKey && flow.stage === 'phase1') {
			const nextAnsweredCount = Math.min(
				flow.phase1.totalQuestions,
				flow.phase1.answeredCount + 1,
			)
			return flow.phase1.totalQuestions === 0
				? 0
				: Math.round((nextAnsweredCount / flow.phase1.totalQuestions) * 100)
		}

		if (pendingAnswerKey && flow.stage === 'phase2') {
			const nextAnsweredCount = Math.min(
				flow.phase2.totalQuestions,
				flow.phase2.answeredCount + 1,
			)
			return flow.phase2.totalQuestions === 0
				? 0
				: Math.round((nextAnsweredCount / flow.phase2.totalQuestions) * 100)
		}

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
		flow.phase1.answeredCount,
		flow.phase1.totalQuestions,
		flow.phase2Progress,
		flow.phase2.answeredCount,
		flow.phase2.totalQuestions,
		flow.protocolCompletion.percent,
		flow.stage,
		pendingAnswerKey,
	])

	const onSubmitReflections = reflectionForm.handleSubmit(async (values) => {
		await flow.saveProtocolReflections(values.reflections)
	})

	const progressColorToken = resolveProgressColorToken(flow)
	const stageTitle = resolveStageTitle(flow)
	const phase1GeneralMaturity = classifyGeneralStructure(
		flow.phase1Summary?.generalIndex ?? 0,
	)
	const phase2GeneralMaturity = classifyPhase2Refined(
		flow.phase2Summary?.generalIndex ?? 0,
	)
	const phase1HighlightCards = [
		{
			id: 'strong',
			label: 'Pilar forte',
			role: 'strong' as PillarOutcomeRole,
			pillar: flow.phase1Summary?.strongPillar ?? null,
			value: flow.phase1Summary?.strongPillar
				? (flow.phase1Summary?.pillarPercentages[
						flow.phase1Summary.strongPillar
					] ?? 0)
				: 0,
		},
		{
			id: 'critical',
			label: 'Pilar crítico',
			role: 'critical' as PillarOutcomeRole,
			pillar: flow.phase1Summary?.criticalPillar ?? null,
			value: flow.phase1Summary?.criticalPillar
				? (flow.phase1Summary?.pillarPercentages[
						flow.phase1Summary.criticalPillar
					] ?? 0)
				: 0,
		},
	] as const
	const phase1StructuralInsights = useMemo(() => {
		if (!flow.phase1Summary) return []
		return buildStructuralInsights(flow.phase1Summary.pillarPercentages)
	}, [flow.phase1Summary])
	const phase1FinalSummary = useMemo(() => {
		if (!flow.phase1Summary) return null
		const asymmetry = getPhase1AsymmetryScore(
			flow.phase1Summary.pillarPercentages,
		)
		const riskStatus = getOperationalRiskInsight(
			Object.values(flow.phase1Summary.pillarPercentages),
		).status
		return getPhase1FinalSummary({
			strongPillar: flow.phase1Summary.strongPillar,
			criticalPillar: flow.phase1Summary.criticalPillar,
			riskStatus,
			asymmetry,
		})
	}, [flow.phase1Summary])
	const shouldShowPhase1Instructions =
		flow.stage === 'phase1' &&
		flow.phase1.answeredCount === 0 &&
		!dismissedInstructions.phase1
	const shouldShowPhase2Instructions =
		flow.stage === 'phase2' &&
		flow.phase2.answeredCount === 0 &&
		!dismissedInstructions.phase2
	const isInstructionStage =
		shouldShowPhase1Instructions || shouldShowPhase2Instructions

	const openDetailedResultPage = (phase: 'phase-1' | 'phase-2') => {
		if (!flow.cycleId) return
		onOpenChange(false)
		router.push(getDiagnosticResultPath(flow.cycleId, phase))
	}

	const handlePhase1Answer = async (value: number) => {
		const key = `phase1:${value}`
		setPendingAnswerKey(key)
		await new Promise((resolve) => setTimeout(resolve, 140))
		await flow.savePhase1Answer(value)
		setPendingAnswerKey(null)
	}

	const handlePhase2Answer = async (value: number) => {
		const key = `phase2:${value}`
		setPendingAnswerKey(key)
		await new Promise((resolve) => setTimeout(resolve, 140))
		await flow.savePhase2Answer(value)
		setPendingAnswerKey(null)
	}

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
				className="flex max-h-[92vh] w-[min(96vw,88rem)]! max-w-352! sm:max-w-352! border-0 bg-transparent p-0 shadow-none backdrop-blur-0"
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
				<Card className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border-border/75 bg-card shadow-[0_20px_50px_rgba(2,8,23,0.28)]">
					<CardHeader className="border-b border-border/70 bg-linear-to-r from-primary/8 via-primary/4 to-transparent p-6">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<CardDescription className="text-[11px] uppercase tracking-[0.12em]">
									Cortex System - Diagnóstico Estrutural
								</CardDescription>

								{!isInstructionStage && stageTitle.eyebrow ? (
									<CardDescription className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
										{stageTitle.eyebrow}
									</CardDescription>
								) : null}

								<CardTitle className="font-(--font-space) text-xl">
									{isInstructionStage ? 'Instrução' : stageTitle.title}
								</CardTitle>
							</div>

							<div className="flex items-center gap-3">
								{!isInstructionStage ? (
									<CircularGradientProgress
										value={progressPercent}
										colorToken={progressColorToken}
									/>
								) : null}
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

					<CardContent
						className={cn(
							'space-y-6 overflow-x-hidden p-6',
							flow.stage === 'phase1-result' ||
								flow.stage === 'phase2' ||
								flow.stage === 'phase2-result' ||
								shouldShowPhase1Instructions ||
								shouldShowPhase2Instructions
								? 'min-h-0 overflow-y-auto pr-4'
								: '',
						)}
					>
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

								{shouldShowPhase1Instructions ? (
									<div className="space-y-6">
										<div className="space-y-3">
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												Cada pergunta descreve um padrão de comportamento
												observável. Sua tarefa é indicar com que frequência ele
												realmente ocorre na sua rotina, utilizando a escala
												oficial do sistema. Não existem respostas certas ou
												erradas: o objetivo é diagnóstico, não julgamento. Todos
												os dados são confidenciais.
											</p>
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												Responda com base em fatos recorrentes do seu dia a dia,
												especialmente na forma como você age sob pressão,
												cansaço ou tomada de decisão real. Evite responder pela
												versão ideal de quem você gostaria de ser; responda pelo
												padrão que efetivamente se repete.
											</p>
										</div>

										<div className="space-y-2">
											<p className="text-lg font-semibold">
												Escala Oficial do Sistema CORTEX
											</p>
											<p className="text-sm text-muted-foreground">
												Aplicada em todas as perguntas
											</p>
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												A escala vai de 1 a 6, sem ponto neutro, para aumentar a
												precisão diagnóstica e reduzir respostas ambíguas.
											</p>
										</div>

										<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
											{responseLevelDescriptions.map((option) => (
												<div
													key={`phase1-instruction:${option.value}`}
													className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg"
												>
													<div className="flex items-start gap-3">
														<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-base font-semibold text-primary">
															{option.value}
														</span>
														<div className="space-y-1">
															<p className="text-sm font-semibold">
																{option.label}
															</p>
															<p className="text-sm leading-6 text-muted-foreground">
																{option.description}
															</p>
														</div>
													</div>
												</div>
											))}
										</div>

										<div className="flex justify-end">
											<Button
												className="h-11 rounded-2xl"
												onClick={() =>
													setDismissedInstructions((current) => ({
														...current,
														phase1: true,
													}))
												}
											>
												Iniciar Fase 1
												<ArrowRight className="size-4" />
											</Button>
										</div>
									</div>
								) : null}

								{flow.stage === 'phase1' && !shouldShowPhase1Instructions ? (
									<div className="space-y-6">
										<div className="mx-auto max-w-4xl space-y-2 text-center">
											<p className="text-xl font-medium leading-relaxed">
												{flow.phase1.currentQuestion}
											</p>
										</div>

										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
											{flow.currentPhase1Options.map((option) => (
												<motion.div
													key={`phase1:${option.value}:${option.label}`}
													animate={
														pendingAnswerKey === `phase1:${option.value}`
															? {
																	scale: 1.08,
																	y: -6,
																}
															: {
																	scale: 1,
																	y: 0,
																}
													}
													transition={{
														type: 'spring',
														stiffness: 420,
														damping: 24,
													}}
												>
													<Button
														variant="outline"
														className={cn(
															'h-14 w-full justify-center rounded-2xl border-border/75 px-3 text-center text-lg font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8',
															pendingAnswerKey === `phase1:${option.value}`
																? 'border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_32%,transparent),0_0_28px_color-mix(in_oklch,var(--primary)_35%,transparent)]'
																: '',
															flow.isSaving ? 'opacity-70' : '',
														)}
														disabled={
															flow.isSaving || pendingAnswerKey !== null
														}
														onClick={() =>
															void handlePhase1Answer(option.value)
														}
													>
														{option.value}
													</Button>
												</motion.div>
											))}
										</div>
									</div>
								) : null}

								{flow.stage === 'phase1-tie' ? (
									<div className="space-y-6">
										<div className="rounded-2xl border border-red-500/40 bg-red-500/12 p-4 text-sm shadow-[0_0_22px_rgba(239,68,68,0.14)]">
											<p className="font-semibold text-red-700 dark:text-red-300">
												Empate estrutural detectado
											</p>
											<p className="mt-2 text-red-700/90 dark:text-red-200/90">
												A escolha do pilar crítico é uma etapa importante do
												diagnóstico. Selecione com atenção o ponto que hoje mais
												limita previsibilidade, estabilidade e conclusão do
												projeto.
											</p>
										</div>

										{flow.tieBreak.criticalCandidates.length > 1 ? (
											<div className="space-y-3">
												<h4
													className="font-semibold"
													style={getPillarOutcomeLabelStyle('critical')}
												>
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
												<h4
													className="font-semibold"
													style={getPillarOutcomeLabelStyle('strong')}
												>
													Pilares fortes empatados
												</h4>
												<p className="text-sm text-muted-foreground">
													Os pilares abaixo empataram como principais forças
													estruturais neste ciclo.
												</p>
												<div className="grid gap-3 sm:grid-cols-2">
													{flow.tieBreak.strongCandidates.map((pillar) => (
														<div
															key={`strong:${pillar}`}
															className="rounded-2xl border p-4"
															style={getPillarOutcomeCardStyle('strong')}
														>
															{pillarLabel(pillar)}
														</div>
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
										<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
											<div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-lg">
												<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
													Índice Geral
												</p>
												<p className="mt-2 text-4xl font-bold">
													{flow.phase1Summary?.generalIndex ?? 0}%
												</p>
												<p className="mt-2 text-sm font-semibold">
													{phase1GeneralMaturity.label}
												</p>
											</div>

											<div className="grid gap-3">
												{phase1HighlightCards.map((item) => (
													<div
														key={item.id}
														className="rounded-2xl border p-4"
														style={getPillarOutcomeCardStyle(item.role)}
													>
														<p
															className="text-xs uppercase tracking-[0.16em]"
															style={getPillarOutcomeLabelStyle(item.role)}
														>
															{item.label}
														</p>
														<p className="mt-2 text-xl font-semibold tracking-tight">
															{pillarLabel(item.pillar)}
														</p>
														<p className="mt-2 text-sm leading-6 text-foreground/78">
															{item.role === 'strong'
																? getStrongPillarDescription(
																		item.pillar,
																		item.value,
																	)
																: getCriticalPillarDescription(
																		item.pillar,
																		item.value,
																	)}
														</p>
													</div>
												))}
											</div>
										</div>

										<div className="grid gap-4 xl:grid-cols-3">
											{phase1StructuralInsights.map((insight) => {
												const InsightIcon = getStructuralInsightIcon(insight.id)

												return (
													<div
														key={insight.id}
														className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg"
													>
														<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
															{insight.valueLabel}
														</p>
														<div className="mt-2 flex items-center gap-2">
															<InsightIcon className="size-4 text-primary" />
															<p className="text-base font-semibold">
																{insight.title}
															</p>
														</div>
														<p className="mt-3 text-sm font-semibold text-foreground">
															{insight.status}
														</p>
														<p className="mt-2 text-sm leading-6 text-foreground/78">
															{insight.description}
														</p>
													</div>
												)
											})}
										</div>

										{phase1FinalSummary ? (
											<div
												className={cn(
													'rounded-2xl border-2 bg-card/80 p-5 backdrop-blur-lg',
													phase1FinalSummary.scenario === 'green'
														? 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.22)]'
														: 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.22)]',
												)}
											>
												<div className="rounded-2xl border-transparent bg-transparent p-0">
													<p className="text-base font-semibold text-foreground">
														{phase1FinalSummary.title}
													</p>
													<div className="mt-3 space-y-3 text-sm leading-6 text-foreground/78">
														{phase1FinalSummary.description
															.split('\n\n')
															.map((paragraph) => (
																<p key={paragraph}>{paragraph}</p>
															))}
													</div>
												</div>
											</div>
										) : null}

										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<Button
												variant="ghost"
												className="h-11 rounded-2xl"
												onClick={() => openDetailedResultPage('phase-1')}
											>
												Resumo Completo
											</Button>
											<Button
												className="h-11 rounded-2xl"
												onClick={flow.startPhase2}
											>
												Próximo Nível
												<ArrowRight className="size-4" />
											</Button>
										</div>
									</div>
								) : null}

								{shouldShowPhase2Instructions ? (
									<div className="space-y-6">
										<div className="space-y-3">
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												Cada pergunta descreve um padrão de comportamento
												observável. Sua tarefa é indicar com que frequência ele
												realmente ocorre na sua rotina, utilizando a escala
												oficial do sistema. Não existem respostas certas ou
												erradas: o objetivo é diagnóstico, não julgamento. Todos
												os dados são confidenciais.
											</p>
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												Responda com base em fatos recorrentes do seu dia a dia,
												especialmente na forma como você age sob pressão,
												cansaço ou tomada de decisão real. Evite responder pela
												versão ideal de quem você gostaria de ser; responda pelo
												padrão que efetivamente se repete.
											</p>
										</div>

										<div className="space-y-2">
											<p className="text-lg font-semibold">
												Escala Oficial do Sistema CORTEX
											</p>
											<p className="text-sm text-muted-foreground">
												Aplicada em todas as perguntas
											</p>
											<p className="max-w-4xl text-sm leading-7 text-muted-foreground">
												A escala vai de 1 a 6, sem ponto neutro, para aumentar a
												precisão diagnóstica e reduzir respostas ambíguas.
											</p>
										</div>

										<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
											{responseLevelDescriptions.map((option) => (
												<div
													key={`phase2-instruction:${option.value}`}
													className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg"
												>
													<div className="flex items-start gap-3">
														<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-base font-semibold text-primary">
															{option.value}
														</span>
														<div className="space-y-1">
															<p className="text-sm font-semibold">
																{option.label}
															</p>
															<p className="text-sm leading-6 text-muted-foreground">
																{option.description}
															</p>
														</div>
													</div>
												</div>
											))}
										</div>

										<div className="flex justify-end">
											<Button
												className="h-11 rounded-2xl"
												onClick={() =>
													setDismissedInstructions((current) => ({
														...current,
														phase2: true,
													}))
												}
											>
												Iniciar Fase 2
												<ArrowRight className="size-4" />
											</Button>
										</div>
									</div>
								) : null}

								{flow.stage === 'phase2' && !shouldShowPhase2Instructions ? (
									<div className="space-y-6">
										<div className="mx-auto max-w-4xl space-y-2 text-center">
											<p className="text-xl font-medium leading-relaxed">
												{flow.phase2.currentQuestion?.title}
											</p>
										</div>

										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
											{flow.phase2.currentOptions.map((option) => (
												<motion.div
													key={`phase2:${option.value}:${option.label}`}
													animate={
														pendingAnswerKey === `phase2:${option.value}`
															? {
																	scale: 1.08,
																	y: -6,
																}
															: {
																	scale: 1,
																	y: 0,
																}
													}
													transition={{
														type: 'spring',
														stiffness: 420,
														damping: 24,
													}}
												>
													<Button
														variant="outline"
														className={cn(
															'h-14 w-full justify-center rounded-2xl border-border/75 px-3 text-center text-lg font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8',
															pendingAnswerKey === `phase2:${option.value}`
																? 'border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_32%,transparent),0_0_28px_color-mix(in_oklch,var(--primary)_35%,transparent)]'
																: '',
															flow.isSaving ? 'opacity-70' : '',
														)}
														disabled={
															flow.isSaving || pendingAnswerKey !== null
														}
														onClick={() =>
															void handlePhase2Answer(option.value)
														}
													>
														{option.value}
													</Button>
												</motion.div>
											))}
										</div>
									</div>
								) : null}

								{flow.stage === 'phase2-result' ? (
									<div className="space-y-6">
										<div
											className="rounded-2xl border p-5"
											style={getPillarOutcomeCardStyle('critical')}
										>
											<p
												className="text-xs uppercase tracking-[0.14em]"
												style={getPillarOutcomeLabelStyle('critical')}
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
												<p className="mt-2 text-xs text-muted-foreground">
													{
														classifyMaturity(
															flow.phase2Summary?.technicalIndex ?? 0,
														).label
													}
												</p>
											</div>
											<div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg">
												<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
													Índice estado atual
												</p>
												<p className="mt-1 text-2xl font-bold">
													{flow.phase2Summary?.stateIndex ?? 0}%
												</p>
												<p className="mt-2 text-xs text-muted-foreground">
													{
														classifyMaturity(
															flow.phase2Summary?.stateIndex ?? 0,
														).label
													}
												</p>
											</div>
											<div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-lg">
												<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
													Índice geral aprofundado
												</p>
												<p className="mt-1 text-2xl font-bold">
													{flow.phase2Summary?.generalIndex ?? 0}%
												</p>
												<p className="mt-2 text-xs text-muted-foreground">
													{phase2GeneralMaturity.label}
												</p>
											</div>
										</div>

										<div className="space-y-3">
											<h4
												className="font-semibold"
												style={getPillarOutcomeLabelStyle('critical')}
											>
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
															<p className="mt-1 text-sm">{point.diagnosis}</p>
														</div>
													))}
												</div>
											)}
										</div>

										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<Button
												variant="ghost"
												className="h-11 rounded-2xl"
												onClick={() => openDetailedResultPage('phase-2')}
											>
												Resumo Completo
											</Button>

											{flow.isReevaluationMode ? (
												<div className="space-y-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-left lg:max-w-sm">
													<p className="text-sm font-semibold">
														Reavaliação concluída
													</p>
													<p className="text-sm">
														{flow.temporalRules.newStructuralDiagnosis.message}
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
									</div>
								) : null}

								{flow.stage === 'protocol-reflections' ? (
									<form className="space-y-5" onSubmit={onSubmitReflections}>
										<p className="text-sm text-muted-foreground">
											Responda as 5 perguntas para liberar as ações práticas.
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
													<Textarea
														id={`reflection-${index}`}
														rows={3}
														placeholder="Descreva sua reflexão aqui..."
														className="resize-none bg-background/80"
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
										<h3 className="font-(--font-space) text-2xl">
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
