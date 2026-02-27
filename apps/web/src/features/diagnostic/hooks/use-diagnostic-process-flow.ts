'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import {
	type CriticalPoint,
	computePhase1Summary,
	computePhase2Summary,
	getCriticalPoints,
	type Phase1Summary,
	type Phase2Summary,
} from '@cortex/shared/domain/diagnostic-calculations'
import { computeDiagnosticTemporalRules } from '@cortex/shared/domain/diagnostic-temporal-rules'
import {
	inferCurrentProtocolBlock,
	isProtocolBlockUnlocked,
	isProtocolCompleted,
} from '@cortex/shared/domain/protocol'
import type {
	Tables,
	TablesInsert,
	TablesUpdate,
} from '@cortex/shared/supabase/database.types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'
import { parseIsoDate } from '@/lib/utils/date-fns-lite'
import { safeStorage } from '@/lib/utils/storage'
import {
	type DiagnosticPhase1PillarBlueprint,
	type DiagnosticPhase2QuestionBlueprint,
	useDiagnosticBlueprintQuery,
} from './use-diagnostic-blueprint-query'

type DiagnosticCycleRow = Tables<'diagnostic_cycles'>
type ProtocolRow = Tables<'protocol_progress'>

type Phase1AnswersMap = Record<string, number>
type Phase2AnswersMap = Record<string, number>

interface Phase1Step {
	pillarIndex: number
	questionIndex: number
}

interface Phase2Step {
	questionIndex: number
}

export type DiagnosticProcessStage =
	| 'phase1'
	| 'phase1-tie'
	| 'phase1-result'
	| 'phase2'
	| 'phase2-result'
	| 'protocol-reflections'
	| 'protocol-actions'
	| 'blocked-45'
	| 'blocked-90'
	| 'completed'

interface ProtocolDraft {
	id: string | null
	reflections: string[]
	block1Actions: boolean[]
	block2Actions: boolean[]
	block3Actions: boolean[]
	currentBlock: 1 | 2 | 3
	completedAt: string | null
}

interface CycleCheckpoint {
	cycleId: string
	phase1Answers: Phase1AnswersMap
	phase2Answers: Phase2AnswersMap
	reflections: string[]
	updatedAt: string
}

const isPillarKey = (value: string | null): value is PillarKey =>
	value === 'clarity' ||
	value === 'structure' ||
	value === 'execution' ||
	value === 'emotional'

const phase1AnswerKey = (pillar: PillarKey, questionNumber: number): string =>
	`${pillar}:${questionNumber}`

const getPhase1QuestionNumber = (
	phase1Pillars: DiagnosticPhase1PillarBlueprint[],
	pillarIndex: number,
	questionIndex: number,
): number => {
	const currentPillar = phase1Pillars[pillarIndex]
	if (!currentPillar) return questionIndex + 1

	let counter = 0
	for (let index = 0; index <= pillarIndex; index += 1) {
		const iterated = phase1Pillars[index]
		if (!iterated || iterated.pillar !== currentPillar.pillar) {
			continue
		}

		if (index === pillarIndex) {
			counter += questionIndex + 1
			break
		}

		counter += iterated.questions.length
	}

	return counter
}

const getCheckpointKey = (userId: string, nicheId: string) =>
	`cortex.diagnostic.checkpoint.${userId}.${nicheId}`

const getTemporalRulesForCycle = (cycle: DiagnosticCycleRow | null) =>
	computeDiagnosticTemporalRules({
		phase1CompletedAt: parseIsoDate(cycle?.phase1_completed_at),
		protocolCompletedAt: parseIsoDate(cycle?.protocol_completed_at),
		reeval45CompletedAt: parseIsoDate(cycle?.reeval_45_completed_at),
	})

const assertPhase2AllowedFromCycle = (
	cycle: DiagnosticCycleRow,
	mode: { isReevaluation: boolean },
): string | null => {
	if (!cycle.phase1_completed_at) {
		return 'Conclua a Fase 1 antes de acessar a Fase 2.'
	}

	const rules = getTemporalRulesForCycle(cycle)

	if (cycle.protocol_completed_at && rules.phase2Reevaluation.isLocked) {
		return rules.phase2Reevaluation.message
	}

	if (cycle.protocol_completed_at && !mode.isReevaluation) {
		return 'Refaça a Fase 1 para iniciar um novo ciclo antes de acessar a Fase 2.'
	}

	return null
}

const getNextPhase1Step = (
	phase1Pillars: DiagnosticPhase1PillarBlueprint[],
	answers: Phase1AnswersMap,
): Phase1Step | null => {
	for (
		let pillarIndex = 0;
		pillarIndex < phase1Pillars.length;
		pillarIndex += 1
	) {
		const pillarConfig = phase1Pillars[pillarIndex]
		if (!pillarConfig) continue

		for (
			let questionIndex = 0;
			questionIndex < pillarConfig.questions.length;
			questionIndex += 1
		) {
			const questionNumber = getPhase1QuestionNumber(
				phase1Pillars,
				pillarIndex,
				questionIndex,
			)
			const key = phase1AnswerKey(pillarConfig.pillar, questionNumber)
			if (!answers[key]) return { pillarIndex, questionIndex }
		}
	}

	return null
}

const toPillarScoreBuckets = (
	phase1Pillars: DiagnosticPhase1PillarBlueprint[],
	answers: Phase1AnswersMap,
): Record<PillarKey, number[]> => {
	const buckets: Record<PillarKey, number[]> = {
		clarity: [],
		structure: [],
		execution: [],
		emotional: [],
	}

	phase1Pillars.forEach((pillarConfig, pillarIndex) => {
		pillarConfig.questions.forEach((_question, questionIndex) => {
			const questionNumber = getPhase1QuestionNumber(
				phase1Pillars,
				pillarIndex,
				questionIndex,
			)
			const score =
				answers[phase1AnswerKey(pillarConfig.pillar, questionNumber)]
			if (!score) return
			buckets[pillarConfig.pillar].push(score)
		})
	})

	return buckets
}

const getPhase2QuestionType = (
	question: DiagnosticPhase2QuestionBlueprint,
	criticalPillar: PillarKey,
): string =>
	question.questionType === 'technical'
		? `technical:${criticalPillar}`
		: 'state:general'

const getPhase2AnswerKey = (
	question: DiagnosticPhase2QuestionBlueprint,
	criticalPillar: PillarKey,
): string =>
	`${getPhase2QuestionType(question, criticalPillar)}:${question.questionNumber}`

const toProtocolDraft = (
	row: ProtocolRow | null,
	reflectionCount = 5,
): ProtocolDraft => {
	const block1 = Array.isArray(row?.block1_actions)
		? row.block1_actions.map(Boolean).slice(0, 3)
		: [false, false, false]
	const block2 = Array.isArray(row?.block2_actions)
		? row.block2_actions.map(Boolean).slice(0, 3)
		: [false, false, false]
	const block3 = Array.isArray(row?.block3_actions)
		? row.block3_actions.map(Boolean).slice(0, 3)
		: [false, false, false]

	const reflectionsRaw = row?.reflections
	const reflections = Array.isArray(reflectionsRaw)
		? reflectionsRaw
				.map((value) => String(value ?? ''))
				.slice(0, reflectionCount)
		: Array.from({ length: reflectionCount }, () => '')

	while (reflections.length < reflectionCount) {
		reflections.push('')
	}

	return {
		id: row?.id ?? null,
		reflections,
		block1Actions: block1.length === 3 ? block1 : [false, false, false],
		block2Actions: block2.length === 3 ? block2 : [false, false, false],
		block3Actions: block3.length === 3 ? block3 : [false, false, false],
		currentBlock:
			row?.current_block === 2 || row?.current_block === 3
				? (row.current_block as 2 | 3)
				: 1,
		completedAt: row?.completed_at ?? null,
	}
}

const hasReflectionsCompleted = (
	reflections: string[],
	expectedCount: number,
): boolean =>
	reflections.length >= expectedCount &&
	reflections.slice(0, expectedCount).every((value) => value.trim().length > 0)

const mapPhase1Rows = (
	rows: Array<
		Pick<Tables<'phase1_responses'>, 'pillar' | 'question_number' | 'score'>
	>,
): Phase1AnswersMap => {
	const map: Phase1AnswersMap = {}

	rows.forEach((row) => {
		if (!isPillarKey(row.pillar)) return
		map[phase1AnswerKey(row.pillar, row.question_number)] = row.score
	})

	return map
}

const mapPhase2Rows = (
	rows: Array<
		Pick<
			Tables<'phase2_responses'>,
			'question_type' | 'question_number' | 'score'
		>
	>,
): Phase2AnswersMap => {
	const map: Phase2AnswersMap = {}

	rows.forEach((row) => {
		const questionType = row.question_type
		const key = `${questionType}:${row.question_number}`
		map[key] = row.score
	})

	return map
}

const isPhase1Complete = (
	totalQuestions: number,
	answers: Phase1AnswersMap,
): boolean => Object.keys(answers).length >= totalQuestions

const extractPhase2Scores = (
	phase2Questions: ReadonlyArray<DiagnosticPhase2QuestionBlueprint>,
	answers: Phase2AnswersMap,
	criticalPillar: PillarKey,
): {
	technicalScores: number[]
	stateScores: number[]
	answeredCount: number
	criticalPointsInput: Array<{
		id: string
		questionType: 'technical' | 'state'
		questionNumber: number
		score: number
		title: string
		pillar?: PillarKey
	}>
} => {
	const technicalScores: number[] = []
	const stateScores: number[] = []
	let answeredCount = 0

	const criticalPointsInput: Array<{
		id: string
		questionType: 'technical' | 'state'
		questionNumber: number
		score: number
		title: string
		pillar?: PillarKey
	}> = []

	phase2Questions.forEach((question) => {
		const key = getPhase2AnswerKey(question, criticalPillar)
		const score = answers[key]
		if (!score) return

		answeredCount += 1
		if (question.questionType === 'technical') {
			technicalScores.push(score)
			criticalPointsInput.push({
				id: key,
				questionType: 'technical',
				questionNumber: question.questionNumber,
				score,
				title: question.title,
				pillar: criticalPillar,
			})
			return
		}

		stateScores.push(score)
		criticalPointsInput.push({
			id: key,
			questionType: 'state',
			questionNumber: question.questionNumber,
			score,
			title: question.title,
		})
	})

	return { technicalScores, stateScores, answeredCount, criticalPointsInput }
}

export const useDiagnosticProcessFlow = (isOpen: boolean) => {
	const { user } = useAuth()
	const { activeNiche } = useActiveNicheAccess()
	const queryClient = useQueryClient()
	const blueprintQuery = useDiagnosticBlueprintQuery()
	const blueprint = blueprintQuery.data
	const activeNicheId = activeNiche?.nicheId ?? null

	const [cycle, setCycle] = useState<DiagnosticCycleRow | null>(null)
	const [phase1Answers, setPhase1Answers] = useState<Phase1AnswersMap>({})
	const [phase2Answers, setPhase2Answers] = useState<Phase2AnswersMap>({})
	const [phase1Summary, setPhase1Summary] = useState<Phase1Summary | null>(null)
	const [phase2Summary, setPhase2Summary] = useState<Phase2Summary | null>(null)
	const [criticalPoints, setCriticalPoints] = useState<CriticalPoint[]>([])
	const [protocol, setProtocol] = useState<ProtocolDraft>(toProtocolDraft(null))
	const [stage, setStage] = useState<DiagnosticProcessStage>('phase1')
	const [phase1Step, setPhase1Step] = useState<Phase1Step | null>(null)
	const [phase2Step, setPhase2Step] = useState<Phase2Step | null>(null)
	const [isReevaluationMode, setIsReevaluationMode] = useState(false)
	const [selectedCriticalPillar, setSelectedCriticalPillar] =
		useState<PillarKey | null>(null)
	const [selectedStrongPillar, setSelectedStrongPillar] =
		useState<PillarKey | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isInitializing, setIsInitializing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const temporalRules = useMemo(() => getTemporalRulesForCycle(cycle), [cycle])

	const resolvedCriticalPillar = useMemo(() => {
		const cycleCriticalPillar = cycle?.critical_pillar ?? null

		if (phase1Summary?.criticalPillar) return phase1Summary.criticalPillar
		if (isPillarKey(cycleCriticalPillar)) return cycleCriticalPillar
		if (selectedCriticalPillar) return selectedCriticalPillar
		return null
	}, [
		cycle?.critical_pillar,
		phase1Summary?.criticalPillar,
		selectedCriticalPillar,
	])

	const phase1Pillars = useMemo(
		() => blueprint?.phase1Pillars ?? [],
		[blueprint?.phase1Pillars],
	)

	const totalPhase1Questions = useMemo(
		() =>
			blueprint?.totalPhase1Questions ??
			phase1Pillars.reduce(
				(total, pillar) => total + pillar.questions.length,
				0,
			),
		[blueprint?.totalPhase1Questions, phase1Pillars],
	)

	const phase2Questions = useMemo(() => {
		if (!resolvedCriticalPillar || !blueprint) {
			return [] as DiagnosticPhase2QuestionBlueprint[]
		}
		return blueprint.getPhase2Questions(resolvedCriticalPillar)
	}, [blueprint, resolvedCriticalPillar])

	const totalPhase2Questions = phase2Questions.length
	const reflectionCount = Math.max(
		1,
		blueprint?.protocolReflections.length ?? 5,
	)

	const saveCheckpoint = useCallback(
		(nextValues: {
			cycleId: string
			phase1Answers?: Phase1AnswersMap
			phase2Answers?: Phase2AnswersMap
			reflections?: string[]
		}) => {
			if (!user?.id || !activeNicheId) return

			const existing = safeStorage.get<CycleCheckpoint | null>(
				getCheckpointKey(user.id, activeNicheId),
				null,
			)

			const payload: CycleCheckpoint = {
				cycleId: nextValues.cycleId,
				phase1Answers:
					nextValues.phase1Answers ?? existing?.phase1Answers ?? {},
				phase2Answers:
					nextValues.phase2Answers ?? existing?.phase2Answers ?? {},
				reflections:
					nextValues.reflections ??
					existing?.reflections ??
					Array.from({ length: reflectionCount }, () => ''),
				updatedAt: new Date().toISOString(),
			}

			safeStorage.set(getCheckpointKey(user.id, activeNicheId), payload)
		},
		[activeNicheId, reflectionCount, user?.id],
	)

	const persistPhase1Summary = useCallback(
		async (
			cycleId: string,
			summary: Phase1Summary,
			options?: {
				forceStatus?: string
			},
		) => {
			if (!user?.id || !activeNicheId) return

			const payload: TablesUpdate<'diagnostic_cycles'> = {
				pillar_clarity: summary.pillarPercentages.clarity,
				pillar_structure: summary.pillarPercentages.structure,
				pillar_execution: summary.pillarPercentages.execution,
				pillar_emotional: summary.pillarPercentages.emotional,
				general_index: summary.generalIndex,
				critical_pillar: summary.criticalPillar,
				strong_pillar: summary.strongPillar,
				phase1_completed_at: new Date().toISOString(),
				status:
					options?.forceStatus ??
					(summary.hasTieBreak ? 'phase1_tie_pending' : 'phase2_in_progress'),
			}

			const { error } = await getSupabaseClient()
				.from('diagnostic_cycles')
				.update(payload)
				.eq('id', cycleId)
				.eq('user_id', user.id)
				.eq('niche_id', activeNicheId)

			if (error) throw new Error(error.message)
		},
		[activeNicheId, user?.id],
	)

	const persistPhase2Summary = useCallback(
		async (
			cycleId: string,
			summary: Phase2Summary,
			options?: {
				isReevaluation?: boolean
			},
		) => {
			if (!user?.id || !activeNicheId) return

			const completedAtIso = new Date().toISOString()
			const payload: TablesUpdate<'diagnostic_cycles'> = {
				phase2_technical_index: summary.technicalIndex,
				phase2_state_index: summary.stateIndex,
				phase2_general_index: summary.generalIndex,
				phase2_completed_at: completedAtIso,
				status: options?.isReevaluation
					? 'reeval_45_completed'
					: 'protocol_in_progress',
			}
			if (options?.isReevaluation) {
				payload.reeval_45_completed_at = completedAtIso
			}

			const { error } = await getSupabaseClient()
				.from('diagnostic_cycles')
				.update(payload)
				.eq('id', cycleId)
				.eq('user_id', user.id)
				.eq('niche_id', activeNicheId)

			if (error) throw new Error(error.message)
		},
		[activeNicheId, user?.id],
	)

	const refreshDashboardQueries = useCallback(async () => {
		if (!user?.id || !activeNicheId) return

		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard.cycle(user.id, activeNicheId),
			}),
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard.protocol(user.id, activeNicheId),
			}),
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard.cycles(user.id, activeNicheId),
			}),
		])
	}, [activeNicheId, queryClient, user?.id])

	const ensureProtocolRow = useCallback(
		async (cycleId: string): Promise<ProtocolDraft> => {
			if (!user?.id || !activeNicheId)
				throw new Error('Usuário sem nicho ativo')

			const supabase = getSupabaseClient()

			const { data: existing, error: fetchError } = await supabase
				.from('protocol_progress')
				.select('*')
				.eq('cycle_id', cycleId)
				.eq('user_id', user.id)
				.eq('niche_id', activeNicheId)
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle()

			if (fetchError) {
				throw new Error(fetchError.message)
			}

			if (existing) {
				return toProtocolDraft(existing, reflectionCount)
			}

			const payload: TablesInsert<'protocol_progress'> = {
				cycle_id: cycleId,
				niche_id: activeNicheId,
				user_id: user.id,
				reflections: Array.from({ length: reflectionCount }, () => ''),
				block1_actions: [false, false, false],
				block2_actions: [false, false, false],
				block3_actions: [false, false, false],
				current_block: 1,
			}

			const { data: created, error: createError } = await supabase
				.from('protocol_progress')
				.insert(payload)
				.select('*')
				.single()

			if (createError) {
				throw new Error(createError.message)
			}

			return toProtocolDraft(created, reflectionCount)
		},
		[activeNicheId, reflectionCount, user?.id],
	)

	const getFreshCycleById = useCallback(
		async (cycleId: string): Promise<DiagnosticCycleRow> => {
			if (!user?.id || !activeNicheId)
				throw new Error('Usuário sem nicho ativo')

			const { data, error } = await getSupabaseClient()
				.from('diagnostic_cycles')
				.select('*')
				.eq('id', cycleId)
				.eq('user_id', user.id)
				.eq('niche_id', activeNicheId)
				.single()

			if (error) {
				throw new Error(error.message)
			}

			return data
		},
		[activeNicheId, user?.id],
	)

	const initialize = useCallback(async () => {
		if (
			!isOpen ||
			!user?.id ||
			!activeNicheId ||
			blueprintQuery.isLoading ||
			!blueprint
		)
			return

		setIsInitializing(true)
		setErrorMessage(null)

		try {
			const supabase = getSupabaseClient()
			const checkpoint = safeStorage.get<CycleCheckpoint | null>(
				getCheckpointKey(user.id, activeNicheId),
				null,
			)

			const { data: latestCycle, error: latestCycleError } = await supabase
				.from('diagnostic_cycles')
				.select('*')
				.eq('user_id', user.id)
				.eq('niche_id', activeNicheId)
				.order('cycle_number', { ascending: false })
				.limit(1)
				.maybeSingle()

			if (latestCycleError) {
				throw new Error(latestCycleError.message)
			}

			let activeCycle = latestCycle
			const latestRules = getTemporalRulesForCycle(latestCycle)

			if (!activeCycle || latestRules.canStartNewCycle) {
				if (activeCycle && latestRules.canStartNewCycle) {
					const nowIso = new Date().toISOString()
					const { error: markReeval90Error } = await supabase
						.from('diagnostic_cycles')
						.update({ reeval_90_completed_at: nowIso })
						.eq('id', activeCycle.id)
						.eq('user_id', user.id)
						.eq('niche_id', activeNicheId)

					if (markReeval90Error) {
						throw new Error(markReeval90Error.message)
					}
				}

				const nextCycleNumber = activeCycle ? activeCycle.cycle_number + 1 : 1
				const payload: TablesInsert<'diagnostic_cycles'> = {
					user_id: user.id,
					niche_id: activeNicheId,
					cycle_number: nextCycleNumber,
					status: 'phase1_in_progress',
				}

				const { data: createdCycle, error: createCycleError } = await supabase
					.from('diagnostic_cycles')
					.insert(payload)
					.select('*')
					.single()

				if (createCycleError) {
					throw new Error(createCycleError.message)
				}

				activeCycle = createdCycle
			}

			if (!activeCycle) {
				throw new Error('Não foi possível iniciar o ciclo diagnóstico.')
			}

			setCycle(activeCycle)
			setIsReevaluationMode(false)

			const [phase1RowsResult, phase2RowsResult] = await Promise.all([
				supabase
					.from('phase1_responses')
					.select('pillar, question_number, score')
					.eq('cycle_id', activeCycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId),
				supabase
					.from('phase2_responses')
					.select('question_type, question_number, score')
					.eq('cycle_id', activeCycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId),
			])

			if (phase1RowsResult.error)
				throw new Error(phase1RowsResult.error.message)
			if (phase2RowsResult.error)
				throw new Error(phase2RowsResult.error.message)

			const phase1FromDb = mapPhase1Rows(phase1RowsResult.data ?? [])
			const phase2FromDb = mapPhase2Rows(phase2RowsResult.data ?? [])

			const phase1Merged =
				checkpoint?.cycleId === activeCycle.id &&
				Object.keys(checkpoint.phase1Answers).length >
					Object.keys(phase1FromDb).length
					? checkpoint.phase1Answers
					: phase1FromDb

			const phase2Merged =
				checkpoint?.cycleId === activeCycle.id &&
				Object.keys(checkpoint.phase2Answers).length >
					Object.keys(phase2FromDb).length
					? checkpoint.phase2Answers
					: phase2FromDb

			setPhase1Answers(phase1Merged)
			setPhase2Answers(phase2Merged)

			const step = getNextPhase1Step(phase1Pillars, phase1Merged)
			setPhase1Step(step)

			if (
				!isPhase1Complete(totalPhase1Questions, phase1Merged) &&
				!activeCycle.phase1_completed_at
			) {
				setStage('phase1')
				return
			}

			const baseSummary = computePhase1Summary(
				toPillarScoreBuckets(phase1Pillars, phase1Merged),
				isPillarKey(activeCycle.critical_pillar)
					? activeCycle.critical_pillar
					: null,
				isPillarKey(activeCycle.strong_pillar)
					? activeCycle.strong_pillar
					: null,
			)

			setPhase1Summary(baseSummary)
			setSelectedCriticalPillar(baseSummary.criticalPillar)
			setSelectedStrongPillar(baseSummary.strongPillar)

			if (!activeCycle.phase1_completed_at) {
				await persistPhase1Summary(activeCycle.id, baseSummary)
			}

			if (baseSummary.hasTieBreak) {
				setStage('phase1-tie')
				return
			}

			setStage('phase1-result')

			const criticalPillar = baseSummary.criticalPillar
			if (!criticalPillar) return

			const questions = blueprint.getPhase2Questions(criticalPillar)
			const phase2Extracted = extractPhase2Scores(
				questions,
				phase2Merged,
				criticalPillar,
			)

			if (
				phase2Extracted.answeredCount < questions.length &&
				!activeCycle.phase2_completed_at
			) {
				const nextQuestionIndex = questions.findIndex((question) => {
					const key = getPhase2AnswerKey(question, criticalPillar)
					return !phase2Merged[key]
				})
				setPhase2Step({ questionIndex: Math.max(0, nextQuestionIndex) })
				if (phase2Extracted.answeredCount > 0) {
					setStage('phase2')
				}
				return
			}

			if (
				phase2Extracted.technicalScores.length > 0 &&
				phase2Extracted.stateScores.length > 0
			) {
				const computedPhase2 = computePhase2Summary(
					phase2Extracted.technicalScores,
					phase2Extracted.stateScores,
				)
				setPhase2Summary(computedPhase2)
				setCriticalPoints(
					getCriticalPoints(phase2Extracted.criticalPointsInput),
				)

				if (!activeCycle.phase2_completed_at) {
					await persistPhase2Summary(activeCycle.id, computedPhase2)
				}
			}

			if (
				!activeCycle.phase2_completed_at &&
				phase2Extracted.answeredCount < questions.length
			) {
				setStage('phase2')
				return
			}

			if (
				!activeCycle.phase2_completed_at &&
				phase2Extracted.answeredCount >= questions.length
			) {
				setStage('phase2-result')
				return
			}

			const protocolDraft = await ensureProtocolRow(activeCycle.id)
			const mergedReflections =
				checkpoint?.cycleId === activeCycle.id &&
				hasReflectionsCompleted(checkpoint.reflections, reflectionCount)
					? checkpoint.reflections
					: protocolDraft.reflections
			const mergedProtocol = {
				...protocolDraft,
				reflections: mergedReflections,
			}

			setProtocol(mergedProtocol)

			if (activeCycle.protocol_completed_at || mergedProtocol.completedAt) {
				const activeRules = getTemporalRulesForCycle(activeCycle)

				if (activeRules.phase2Reevaluation.isLocked) {
					setStage('blocked-45')
					return
				}

				if (activeRules.canRunPhase2Reevaluation) {
					setIsReevaluationMode(true)
					setPhase2Summary(null)
					setCriticalPoints([])
					setPhase2Answers({})
					setPhase2Step({ questionIndex: 0 })
					setStage('phase2')
					return
				}

				if (activeRules.newStructuralDiagnosis.isLocked) {
					setStage('blocked-90')
					return
				}

				setStage('phase1')
				return
			}

			setStage(
				hasReflectionsCompleted(mergedProtocol.reflections, reflectionCount)
					? 'protocol-actions'
					: 'protocol-reflections',
			)
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'Falha ao inicializar o diagnóstico.',
			)
		} finally {
			setIsInitializing(false)
		}
	}, [
		activeNicheId,
		blueprint,
		blueprintQuery.isLoading,
		ensureProtocolRow,
		isOpen,
		phase1Pillars,
		persistPhase1Summary,
		persistPhase2Summary,
		reflectionCount,
		totalPhase1Questions,
		user?.id,
	])

	useEffect(() => {
		if (!isOpen) return
		void initialize()
	}, [initialize, isOpen])

	const savePhase1Answer = useCallback(
		async (score: number) => {
			if (!user?.id || !activeNicheId || !cycle?.id || !phase1Step || isSaving)
				return

			setIsSaving(true)
			setErrorMessage(null)
			const toastId = toast.loading('Salvando progresso...')

			try {
				const supabase = getSupabaseClient()
				const pillarConfig = phase1Pillars[phase1Step.pillarIndex]
				if (!pillarConfig) throw new Error('Pilar inválido.')

				const pillar = pillarConfig.pillar
				const questionNumber = getPhase1QuestionNumber(
					phase1Pillars,
					phase1Step.pillarIndex,
					phase1Step.questionIndex,
				)

				const { data: existing } = await supabase
					.from('phase1_responses')
					.select('id')
					.eq('cycle_id', cycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)
					.eq('pillar', pillar)
					.eq('question_number', questionNumber)
					.order('created_at', { ascending: false })
					.limit(1)
					.maybeSingle()

				if (existing?.id) {
					const { error: updateError } = await supabase
						.from('phase1_responses')
						.update({ score })
						.eq('id', existing.id)
					if (updateError) throw new Error(updateError.message)
				} else {
					const { error: insertError } = await supabase
						.from('phase1_responses')
						.insert({
							cycle_id: cycle.id,
							niche_id: activeNicheId,
							user_id: user.id,
							pillar,
							question_number: questionNumber,
							score,
						})
					if (insertError) throw new Error(insertError.message)
				}

				await supabase
					.from('diagnostic_cycles')
					.update({ status: 'phase1_in_progress' })
					.eq('id', cycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)

				const nextAnswers = {
					...phase1Answers,
					[phase1AnswerKey(pillar, questionNumber)]: score,
				}
				const nextStep = getNextPhase1Step(phase1Pillars, nextAnswers)

				setPhase1Answers(nextAnswers)
				setPhase1Step(nextStep)
				saveCheckpoint({ cycleId: cycle.id, phase1Answers: nextAnswers })

				if (nextStep) {
					toast.success('Progresso salvo.', { id: toastId })
					return
				}

				const summary = computePhase1Summary(
					toPillarScoreBuckets(phase1Pillars, nextAnswers),
				)
				setPhase1Summary(summary)
				setSelectedCriticalPillar(summary.criticalPillar)
				setSelectedStrongPillar(summary.strongPillar)
				await persistPhase1Summary(cycle.id, summary)
				setCycle((previous) => {
					if (!previous) return previous
					const nowIso = new Date().toISOString()
					return {
						...previous,
						pillar_clarity: summary.pillarPercentages.clarity,
						pillar_structure: summary.pillarPercentages.structure,
						pillar_execution: summary.pillarPercentages.execution,
						pillar_emotional: summary.pillarPercentages.emotional,
						general_index: summary.generalIndex,
						critical_pillar: summary.criticalPillar,
						strong_pillar: summary.strongPillar,
						phase1_completed_at: nowIso,
						status: summary.hasTieBreak
							? 'phase1_tie_pending'
							: 'phase2_in_progress',
						updated_at: nowIso,
					}
				})
				await refreshDashboardQueries()

				setStage(summary.hasTieBreak ? 'phase1-tie' : 'phase1-result')
				toast.success(
					summary.hasTieBreak
						? 'Fase 1 concluída. Selecione o pilar para desempate.'
						: 'Fase 1 concluída com sucesso.',
					{ id: toastId },
				)
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: 'Não foi possível salvar a resposta.',
				)
				toast.error('Falha ao salvar progresso.', { id: toastId })
			} finally {
				setIsSaving(false)
			}
		},
		[
			cycle?.id,
			activeNicheId,
			phase1Pillars,
			isSaving,
			persistPhase1Summary,
			phase1Answers,
			phase1Step,
			refreshDashboardQueries,
			saveCheckpoint,
			user?.id,
		],
	)

	const resolveTieBreak = useCallback(async () => {
		if (!phase1Summary || !cycle?.id || !user?.id || isSaving) return

		const needsCritical =
			phase1Summary.criticalCandidates.length > 1 && !selectedCriticalPillar
		const needsStrong =
			phase1Summary.strongCandidates.length > 1 && !selectedStrongPillar
		if (needsCritical || needsStrong) {
			setErrorMessage('Selecione os pilares para resolver o empate.')
			return
		}

		setIsSaving(true)
		setErrorMessage(null)
		const toastId = toast.loading('Salvando desempate...')

		try {
			const resolvedSummary = computePhase1Summary(
				toPillarScoreBuckets(phase1Pillars, phase1Answers),
				selectedCriticalPillar,
				selectedStrongPillar,
			)

			if (!resolvedSummary.criticalPillar || !resolvedSummary.strongPillar) {
				throw new Error('Não foi possível resolver o desempate.')
			}

			await persistPhase1Summary(cycle.id, resolvedSummary, {
				forceStatus: 'phase2_in_progress',
			})
			setPhase1Summary(resolvedSummary)
			setCycle((previous) => {
				if (!previous) return previous
				const nowIso = new Date().toISOString()
				return {
					...previous,
					pillar_clarity: resolvedSummary.pillarPercentages.clarity,
					pillar_structure: resolvedSummary.pillarPercentages.structure,
					pillar_execution: resolvedSummary.pillarPercentages.execution,
					pillar_emotional: resolvedSummary.pillarPercentages.emotional,
					general_index: resolvedSummary.generalIndex,
					critical_pillar: resolvedSummary.criticalPillar,
					strong_pillar: resolvedSummary.strongPillar,
					phase1_completed_at: nowIso,
					status: 'phase2_in_progress',
					updated_at: nowIso,
				}
			})
			await refreshDashboardQueries()
			setStage('phase1-result')
			toast.success('Desempate salvo. Você pode seguir para a Fase 2.', {
				id: toastId,
			})
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : 'Falha ao salvar desempate.',
			)
			toast.error('Não foi possível salvar o desempate.', { id: toastId })
		} finally {
			setIsSaving(false)
		}
	}, [
		cycle?.id,
		isSaving,
		phase1Pillars,
		persistPhase1Summary,
		phase1Answers,
		phase1Summary,
		refreshDashboardQueries,
		selectedCriticalPillar,
		selectedStrongPillar,
		user?.id,
	])

	const startPhase2 = useCallback(async () => {
		if (!cycle?.id) return

		try {
			const freshCycle = await getFreshCycleById(cycle.id)
			const phase2GateError = assertPhase2AllowedFromCycle(freshCycle, {
				isReevaluation: isReevaluationMode,
			})

			if (phase2GateError) {
				setErrorMessage(phase2GateError)
				setStage(
					freshCycle.protocol_completed_at &&
						getTemporalRulesForCycle(freshCycle).phase2Reevaluation.isLocked
						? 'blocked-45'
						: 'phase1',
				)
				return
			}

			if (!resolvedCriticalPillar) {
				setErrorMessage('Defina o pilar crítico para avançar.')
				return
			}

			if (phase2Questions.length === 0) {
				setErrorMessage(
					'Nenhuma pergunta cadastrada para a Fase 2 deste pilar.',
				)
				return
			}

			const firstPending = phase2Questions.findIndex((question) => {
				const key = getPhase2AnswerKey(question, resolvedCriticalPillar)
				return !phase2Answers[key]
			})

			setCycle(freshCycle)
			setPhase2Step({
				questionIndex: Math.max(0, firstPending),
			})
			setStage('phase2')
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'Não foi possível validar a Fase 2.',
			)
		}
	}, [
		cycle?.id,
		getFreshCycleById,
		isReevaluationMode,
		phase2Answers,
		phase2Questions,
		resolvedCriticalPillar,
	])

	const savePhase2Answer = useCallback(
		async (score: number) => {
			if (
				!user?.id ||
				!activeNicheId ||
				!cycle?.id ||
				!resolvedCriticalPillar ||
				!phase2Step ||
				isSaving
			)
				return

			const question = phase2Questions[phase2Step.questionIndex]
			if (!question) return

			setIsSaving(true)
			setErrorMessage(null)
			const toastId = toast.loading('Salvando progresso...')

			try {
				const freshCycle = await getFreshCycleById(cycle.id)
				const phase2GateError = assertPhase2AllowedFromCycle(freshCycle, {
					isReevaluation: isReevaluationMode,
				})
				if (phase2GateError) {
					setErrorMessage(phase2GateError)
					setStage(
						freshCycle.protocol_completed_at &&
							getTemporalRulesForCycle(freshCycle).phase2Reevaluation.isLocked
							? 'blocked-45'
							: 'phase1',
					)
					toast.error('Fase 2 bloqueada pelas regras temporais.', {
						id: toastId,
					})
					return
				}

				const supabase = getSupabaseClient()
				const questionType = getPhase2QuestionType(
					question,
					resolvedCriticalPillar,
				)

				const { data: existing } = await supabase
					.from('phase2_responses')
					.select('id')
					.eq('cycle_id', cycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)
					.eq('question_type', questionType)
					.eq('question_number', question.questionNumber)
					.order('created_at', { ascending: false })
					.limit(1)
					.maybeSingle()

				if (existing?.id) {
					const { error: updateError } = await supabase
						.from('phase2_responses')
						.update({ score })
						.eq('id', existing.id)
					if (updateError) throw new Error(updateError.message)
				} else {
					const { error: insertError } = await supabase
						.from('phase2_responses')
						.insert({
							cycle_id: cycle.id,
							niche_id: activeNicheId,
							user_id: user.id,
							question_type: questionType,
							question_number: question.questionNumber,
							score,
						})
					if (insertError) throw new Error(insertError.message)
				}

				await supabase
					.from('diagnostic_cycles')
					.update({ status: 'phase2_in_progress' })
					.eq('id', freshCycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)

				const answerKey = getPhase2AnswerKey(question, resolvedCriticalPillar)
				const nextAnswers = {
					...phase2Answers,
					[answerKey]: score,
				}
				setPhase2Answers(nextAnswers)
				saveCheckpoint({ cycleId: cycle.id, phase2Answers: nextAnswers })

				const nextIndex = phase2Questions.findIndex((questionItem) => {
					const key = getPhase2AnswerKey(questionItem, resolvedCriticalPillar)
					return !nextAnswers[key]
				})

				if (nextIndex >= 0) {
					setPhase2Step({ questionIndex: nextIndex })
					toast.success('Progresso salvo.', { id: toastId })
					return
				}

				const extracted = extractPhase2Scores(
					phase2Questions,
					nextAnswers,
					resolvedCriticalPillar,
				)
				const summary = computePhase2Summary(
					extracted.technicalScores,
					extracted.stateScores,
				)
				setPhase2Summary(summary)
				setCriticalPoints(getCriticalPoints(extracted.criticalPointsInput))
				await persistPhase2Summary(freshCycle.id, summary, {
					isReevaluation: isReevaluationMode,
				})
				setCycle((previous) => {
					if (!previous) return previous

					const completedAtIso = new Date().toISOString()
					return {
						...previous,
						phase2_technical_index: summary.technicalIndex,
						phase2_state_index: summary.stateIndex,
						phase2_general_index: summary.generalIndex,
						phase2_completed_at: completedAtIso,
						reeval_45_completed_at: isReevaluationMode
							? completedAtIso
							: previous.reeval_45_completed_at,
						status: isReevaluationMode
							? 'reeval_45_completed'
							: 'protocol_in_progress',
						updated_at: completedAtIso,
					}
				})
				await refreshDashboardQueries()
				setStage('phase2-result')
				toast.success(
					isReevaluationMode
						? 'Reavaliação concluída com sucesso.'
						: 'Fase 2 concluída com sucesso.',
					{ id: toastId },
				)
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: 'Não foi possível salvar a resposta.',
				)
				toast.error('Falha ao salvar progresso.', { id: toastId })
			} finally {
				setIsSaving(false)
			}
		},
		[
			cycle?.id,
			activeNicheId,
			isSaving,
			persistPhase2Summary,
			phase2Answers,
			phase2Questions,
			phase2Step,
			refreshDashboardQueries,
			resolvedCriticalPillar,
			saveCheckpoint,
			getFreshCycleById,
			isReevaluationMode,
			user?.id,
		],
	)

	const startProtocol = useCallback(async () => {
		if (!cycle?.id || !user?.id || !activeNicheId || isSaving) return
		if (isReevaluationMode || cycle.protocol_completed_at) {
			setStage('blocked-90')
			setErrorMessage(temporalRules.newStructuralDiagnosis.message)
			return
		}

		setIsSaving(true)
		setErrorMessage(null)
		const toastId = toast.loading('Preparando protocolo...')

		try {
			const protocolDraft = await ensureProtocolRow(cycle.id)
			setProtocol(protocolDraft)
			setStage(
				hasReflectionsCompleted(protocolDraft.reflections, reflectionCount)
					? 'protocol-actions'
					: 'protocol-reflections',
			)
			toast.success('Protocolo disponível.', { id: toastId })
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'Não foi possível abrir o protocolo.',
			)
			toast.error('Falha ao preparar protocolo.', { id: toastId })
		} finally {
			setIsSaving(false)
		}
	}, [
		cycle?.id,
		cycle?.protocol_completed_at,
		ensureProtocolRow,
		isReevaluationMode,
		isSaving,
		reflectionCount,
		temporalRules.newStructuralDiagnosis.message,
		activeNicheId,
		user?.id,
	])

	const saveProtocolReflections = useCallback(
		async (reflections: string[]) => {
			if (!cycle?.id || !user?.id || !activeNicheId || isSaving) return

			if (!hasReflectionsCompleted(reflections, reflectionCount)) {
				setErrorMessage(
					`Preencha as ${reflectionCount} reflexões para continuar.`,
				)
				return
			}

			setIsSaving(true)
			setErrorMessage(null)
			const toastId = toast.loading('Salvando reflexões...')

			try {
				const protocolDraft = await ensureProtocolRow(cycle.id)

				const { error } = await getSupabaseClient()
					.from('protocol_progress')
					.update({
						reflections,
						current_block: inferCurrentProtocolBlock(
							protocolDraft.block1Actions,
							protocolDraft.block2Actions,
							protocolDraft.block3Actions,
						),
					})
					.eq('id', protocolDraft.id ?? '')
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)

				if (error) throw new Error(error.message)

				setProtocol((previous) => ({
					...previous,
					id: protocolDraft.id,
					reflections,
				}))
				saveCheckpoint({ cycleId: cycle.id, reflections })
				setStage('protocol-actions')
				await refreshDashboardQueries()
				toast.success('Reflexões salvas.', { id: toastId })
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: 'Não foi possível salvar as reflexões.',
				)
				toast.error('Falha ao salvar reflexões.', { id: toastId })
			} finally {
				setIsSaving(false)
			}
		},
		[
			cycle?.id,
			ensureProtocolRow,
			isSaving,
			reflectionCount,
			refreshDashboardQueries,
			saveCheckpoint,
			activeNicheId,
			user?.id,
		],
	)

	const toggleProtocolAction = useCallback(
		async (block: 1 | 2 | 3, actionIndex: number) => {
			if (!cycle?.id || !user?.id || !activeNicheId || isSaving) return

			const unlocked = isProtocolBlockUnlocked(
				block,
				protocol.block1Actions,
				protocol.block2Actions,
			)

			if (!unlocked) {
				setErrorMessage('Conclua o bloco anterior para desbloquear esta ação.')
				return
			}

			setIsSaving(true)
			setErrorMessage(null)
			const toastId = toast.loading('Salvando ação...')

			try {
				const protocolDraft = await ensureProtocolRow(cycle.id)

				const block1Actions = [...protocol.block1Actions]
				const block2Actions = [...protocol.block2Actions]
				const block3Actions = [...protocol.block3Actions]

				const blockArray =
					block === 1
						? block1Actions
						: block === 2
							? block2Actions
							: block3Actions

				if (typeof blockArray[actionIndex] !== 'boolean') {
					blockArray[actionIndex] = false
				}

				blockArray[actionIndex] = !blockArray[actionIndex]

				const nextCurrentBlock = inferCurrentProtocolBlock(
					block1Actions,
					block2Actions,
					block3Actions,
				)
				const completed = isProtocolCompleted(
					block1Actions,
					block2Actions,
					block3Actions,
				)
				const completedAt = completed ? new Date().toISOString() : null

				const { error: protocolError } = await getSupabaseClient()
					.from('protocol_progress')
					.update({
						block1_actions: block1Actions,
						block2_actions: block2Actions,
						block3_actions: block3Actions,
						current_block: nextCurrentBlock,
						completed_at: completedAt,
					})
					.eq('id', protocolDraft.id ?? '')
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)

				if (protocolError) throw new Error(protocolError.message)

				const cyclePayload: TablesUpdate<'diagnostic_cycles'> = completed
					? {
							status: 'protocol_completed',
							protocol_completed_at: completedAt,
						}
					: {
							status: 'protocol_in_progress',
						}

				const { error: cycleError } = await getSupabaseClient()
					.from('diagnostic_cycles')
					.update(cyclePayload)
					.eq('id', cycle.id)
					.eq('user_id', user.id)
					.eq('niche_id', activeNicheId)

				if (cycleError) throw new Error(cycleError.message)

				setCycle((previous) => {
					if (!previous) return previous
					const nowIso = new Date().toISOString()
					return {
						...previous,
						status: completed ? 'protocol_completed' : 'protocol_in_progress',
						protocol_completed_at: completedAt,
						updated_at: nowIso,
					}
				})

				setProtocol((previous) => ({
					...previous,
					id: protocolDraft.id,
					block1Actions,
					block2Actions,
					block3Actions,
					currentBlock: nextCurrentBlock,
					completedAt,
				}))

				await refreshDashboardQueries()

				if (completed) {
					setStage('completed')
					toast.success('Protocolo concluído. Ciclo finalizado.', {
						id: toastId,
					})
				} else {
					toast.success('Ação salva.', { id: toastId })
				}
			} catch (error) {
				setErrorMessage(
					error instanceof Error
						? error.message
						: 'Não foi possível salvar a ação.',
				)
				toast.error('Falha ao salvar ação.', { id: toastId })
			} finally {
				setIsSaving(false)
			}
		},
		[
			cycle?.id,
			ensureProtocolRow,
			isSaving,
			activeNicheId,
			protocol.block1Actions,
			protocol.block2Actions,
			protocol.block3Actions,
			refreshDashboardQueries,
			user?.id,
		],
	)

	const openPhase1Result = useCallback(() => {
		setStage('phase1-result')
	}, [])

	const openPhase2Result = useCallback(() => {
		setStage('phase2-result')
	}, [])

	const phase1Progress = useMemo(
		() =>
			totalPhase1Questions === 0
				? 0
				: Math.round(
						(Math.min(totalPhase1Questions, Object.keys(phase1Answers).length) /
							totalPhase1Questions) *
							100,
					),
		[phase1Answers, totalPhase1Questions],
	)

	const currentPhase1Pillar = useMemo(() => {
		if (!phase1Step) return null
		return phase1Pillars[phase1Step.pillarIndex] ?? null
	}, [phase1Pillars, phase1Step])

	const currentPhase1Question = useMemo(() => {
		if (!phase1Step || !currentPhase1Pillar) return null
		return currentPhase1Pillar.questions[phase1Step.questionIndex] ?? null
	}, [currentPhase1Pillar, phase1Step])

	const phase2Extracted = useMemo(() => {
		if (!resolvedCriticalPillar) {
			return {
				technicalScores: [] as number[],
				stateScores: [] as number[],
				answeredCount: 0,
				criticalPointsInput: [] as Array<{
					id: string
					questionType: 'technical' | 'state'
					questionNumber: number
					score: number
					title: string
					pillar?: PillarKey
				}>,
			}
		}

		return extractPhase2Scores(
			phase2Questions,
			phase2Answers,
			resolvedCriticalPillar,
		)
	}, [phase2Answers, phase2Questions, resolvedCriticalPillar])

	const phase2Progress = useMemo(
		() =>
			totalPhase2Questions === 0
				? 0
				: Math.round(
						(Math.min(totalPhase2Questions, phase2Extracted.answeredCount) /
							totalPhase2Questions) *
							100,
					),
		[phase2Extracted.answeredCount, totalPhase2Questions],
	)

	const currentPhase2Question = useMemo(() => {
		if (!phase2Step) return null
		return phase2Questions[phase2Step.questionIndex] ?? null
	}, [phase2Questions, phase2Step])

	const protocolReflectionPrompts = blueprint?.protocolReflections ?? []
	const protocolActionBlocks = blueprint?.protocolActionBlocks?.length
		? blueprint.protocolActionBlocks
		: []
	const totalProtocolActions = useMemo(() => {
		if (protocolActionBlocks.length === 0) return 9
		return protocolActionBlocks.reduce(
			(total, block) => total + block.actions.length,
			0,
		)
	}, [protocolActionBlocks])

	const protocolCompletion = useMemo(() => {
		const completedActions = [
			...protocol.block1Actions,
			...protocol.block2Actions,
			...protocol.block3Actions,
		].filter(Boolean).length
		const totalActions = totalProtocolActions
		return {
			completedActions,
			totalActions,
			percent:
				totalActions === 0
					? 0
					: Math.round((completedActions / totalActions) * 100),
		}
	}, [
		protocol.block1Actions,
		protocol.block2Actions,
		protocol.block3Actions,
		totalProtocolActions,
	])

	const currentPhase1Options = currentPhase1Pillar?.options ?? []
	const currentPhase2Options = currentPhase2Question?.options ?? []

	const protocolCompletedAt = useMemo(() => {
		const fromCycle = parseIsoDate(cycle?.protocol_completed_at)
		if (fromCycle) return fromCycle
		return parseIsoDate(protocol.completedAt)
	}, [cycle?.protocol_completed_at, protocol.completedAt])

	return {
		isInitializing: isInitializing || blueprintQuery.isLoading,
		isSaving,
		errorMessage,
		stage,
		cycleNumber: cycle?.cycle_number ?? 1,
		isReevaluationMode,
		temporalRules,
		phase1Progress,
		phase2Progress,
		phase1Summary,
		phase2Summary,
		criticalPoints,
		protocol,
		protocolCompletedAt,
		protocolCompletion,
		phase1: {
			totalQuestions: totalPhase1Questions,
			answeredCount: Math.min(
				totalPhase1Questions,
				Object.keys(phase1Answers).length,
			),
			currentPillarTitle: currentPhase1Pillar?.title ?? null,
			currentPillarIndex: phase1Step ? phase1Step.pillarIndex + 1 : null,
			totalPillars: phase1Pillars.length,
			currentQuestion: currentPhase1Question,
		},
		phase2: {
			totalQuestions: totalPhase2Questions,
			answeredCount: Math.min(
				totalPhase2Questions,
				phase2Extracted.answeredCount,
			),
			currentQuestion: currentPhase2Question,
			currentQuestionPosition: phase2Step ? phase2Step.questionIndex + 1 : null,
			criticalPillar: resolvedCriticalPillar,
			currentOptions: currentPhase2Options,
		},
		currentPhase1Options,
		tieBreak: {
			criticalCandidates: phase1Summary?.criticalCandidates ?? [],
			strongCandidates: phase1Summary?.strongCandidates ?? [],
			selectedCriticalPillar,
			selectedStrongPillar,
		},
		protocolMeta: {
			reflectionsPrompts: protocolReflectionPrompts,
			actionBlocks: protocolActionBlocks,
		},
		setSelectedCriticalPillar,
		setSelectedStrongPillar,
		savePhase1Answer,
		resolveTieBreak,
		startPhase2,
		savePhase2Answer,
		startProtocol,
		saveProtocolReflections,
		toggleProtocolAction,
		openPhase1Result,
		openPhase2Result,
		setStage,
	}
}
