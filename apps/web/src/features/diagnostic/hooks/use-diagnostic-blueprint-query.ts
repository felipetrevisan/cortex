'use client'

import type { PillarKey } from '@cortex/shared/constants/pillars'
import {
	PROTOCOL_ACTION_BLOCKS,
	PROTOCOL_REFLECTION_PROMPTS,
} from '@cortex/shared/domain/protocol'
import {
	mapDiagnosticNiche,
	mapDiagnosticPhase,
	mapDiagnosticPhaseOption,
	mapDiagnosticPhaseQuestion,
} from '@cortex/shared/models/diagnostic-config.model'
import { useQuery } from '@tanstack/react-query'
import { useActiveNicheAccess } from '@/features/auth/hooks/use-active-niche-access'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
	PHASE1_QUESTIONNAIRE,
	PHASE1_RESPONSE_OPTIONS,
} from '../constants/phase1-questionnaire'
import {
	getPhase2TechnicalQuestions as getFallbackPhase2TechnicalQuestions,
	PHASE2_STATE_QUESTIONS,
} from '../constants/phase2-questionnaire'

export interface DiagnosticResponseOption {
	label: string
	value: number
}

export interface DiagnosticPhase1PillarBlueprint {
	phaseId: string
	pillar: PillarKey
	title: string
	questions: string[]
	options: DiagnosticResponseOption[]
}

export interface DiagnosticPhase2QuestionBlueprint {
	phaseId: string
	questionType: 'technical' | 'state'
	questionNumber: number
	title: string
	options: DiagnosticResponseOption[]
}

export interface DiagnosticProtocolActionBlockBlueprint {
	block: 1 | 2 | 3
	title: string
	actions: string[]
}

export interface DiagnosticBlueprint {
	source: 'dynamic' | 'fallback'
	nicheName: string
	phase1Pillars: DiagnosticPhase1PillarBlueprint[]
	totalPhase1Questions: number
	getPhase2Questions: (pillar: PillarKey) => DiagnosticPhase2QuestionBlueprint[]
	protocolReflections: string[]
	protocolActionBlocks: DiagnosticProtocolActionBlockBlueprint[]
}

const fallbackOptions = PHASE1_RESPONSE_OPTIONS.map((item) => ({
	value: item.value,
	label: item.label,
}))

const fallbackBlueprint: DiagnosticBlueprint = {
	source: 'fallback',
	nicheName: 'Genérico',
	phase1Pillars: PHASE1_QUESTIONNAIRE.map((pillar) => ({
		phaseId: `fallback:${pillar.pillar}`,
		pillar: pillar.pillar,
		title: pillar.title,
		questions: pillar.questions,
		options: fallbackOptions,
	})),
	totalPhase1Questions: PHASE1_QUESTIONNAIRE.reduce(
		(total, pillar) => total + pillar.questions.length,
		0,
	),
	getPhase2Questions: (pillar) => [
		...getFallbackPhase2TechnicalQuestions(pillar).map((question) => ({
			phaseId: `fallback:phase2:technical:${pillar}`,
			questionType: 'technical' as const,
			questionNumber: question.questionNumber,
			title: question.title,
			options: fallbackOptions,
		})),
		...PHASE2_STATE_QUESTIONS.map((question) => ({
			phaseId: 'fallback:phase2:state',
			questionType: 'state' as const,
			questionNumber: question.questionNumber,
			title: question.title,
			options: fallbackOptions,
		})),
	],
	protocolReflections: [...PROTOCOL_REFLECTION_PROMPTS],
	protocolActionBlocks: [...PROTOCOL_ACTION_BLOCKS],
}

const toPillarKey = (value: string | null): PillarKey | null => {
	if (
		value === 'clarity' ||
		value === 'structure' ||
		value === 'execution' ||
		value === 'emotional'
	) {
		return value
	}
	return null
}

export const useDiagnosticBlueprintQuery = () => {
	const { activeNiche } = useActiveNicheAccess()

	return useQuery({
		queryKey: queryKeys.diagnostic.blueprint(
			activeNiche?.nicheId ?? 'no-niche',
		),
		enabled: Boolean(activeNiche?.nicheId),
		queryFn: async (): Promise<DiagnosticBlueprint> => {
			try {
				if (!activeNiche?.nicheId) {
					return fallbackBlueprint
				}

				const supabase = getSupabaseClient()

				const { data: selectedNiche, error: nicheError } = await supabase
					.from('diagnostic_niches')
					.select('*')
					.eq('id', activeNiche.nicheId)
					.eq('is_active', true)
					.maybeSingle()

				if (nicheError || !selectedNiche) {
					return fallbackBlueprint
				}

				const niche = mapDiagnosticNiche(selectedNiche)

				const { data: phaseRows, error: phasesError } = await supabase
					.from('diagnostic_phases')
					.select('*')
					.eq('niche_id', niche.id)
					.eq('is_active', true)
					.order('order_index', { ascending: true })
					.order('created_at', { ascending: true })

				if (phasesError || !phaseRows || phaseRows.length === 0) {
					return fallbackBlueprint
				}

				const phases = phaseRows.map(mapDiagnosticPhase)
				const phaseIds = phases.map((phase) => phase.id)

				const [
					{ data: questionRows, error: questionsError },
					{ data: optionRows, error: optionsError },
				] = await Promise.all([
					supabase
						.from('diagnostic_phase_questions')
						.select('*')
						.in('phase_id', phaseIds)
						.eq('is_active', true)
						.order('order_index', { ascending: true })
						.order('created_at', { ascending: true }),
					supabase
						.from('diagnostic_phase_options')
						.select('*')
						.in('phase_id', phaseIds)
						.eq('is_active', true)
						.order('order_index', { ascending: true })
						.order('created_at', { ascending: true }),
				])

				if (questionsError || optionsError) {
					return fallbackBlueprint
				}

				const questions = (questionRows ?? []).map(mapDiagnosticPhaseQuestion)
				const options = (optionRows ?? []).map(mapDiagnosticPhaseOption)

				const questionsByPhase = new Map<string, typeof questions>()
				questions.forEach((question) => {
					const current = questionsByPhase.get(question.phaseId) ?? []
					current.push(question)
					questionsByPhase.set(question.phaseId, current)
				})

				const optionsByPhase = new Map<string, DiagnosticResponseOption[]>()
				options.forEach((option) => {
					const current = optionsByPhase.get(option.phaseId) ?? []
					current.push({ label: option.label, value: option.value })
					optionsByPhase.set(option.phaseId, current)
				})

				const phase1Pillars = phases
					.filter((phase) => phase.phaseType === 'phase1')
					.map((phase) => {
						const pillar = toPillarKey(phase.pillar)
						if (!pillar) return null

						const phaseQuestions = questionsByPhase.get(phase.id) ?? []
						if (phaseQuestions.length === 0) return null

						return {
							phaseId: phase.id,
							pillar,
							title: phase.title,
							questions: phaseQuestions.map((item) => item.prompt),
							options: optionsByPhase.get(phase.id) ?? fallbackOptions,
						}
					})
					.filter((item): item is DiagnosticPhase1PillarBlueprint =>
						Boolean(item),
					)

				if (phase1Pillars.length === 0) {
					return fallbackBlueprint
				}

				const phase2TechnicalByPillar: Record<
					PillarKey,
					DiagnosticPhase2QuestionBlueprint[]
				> = {
					clarity: [],
					structure: [],
					execution: [],
					emotional: [],
				}

				;(
					['clarity', 'structure', 'execution', 'emotional'] as PillarKey[]
				).forEach((pillar) => {
					const technicalPhases = phases.filter(
						(phase) =>
							phase.phaseType === 'phase2_technical' && phase.pillar === pillar,
					)

					let technicalCounter = 0
					const technicalQuestions = technicalPhases.flatMap((phase) => {
						const phaseQuestions = questionsByPhase.get(phase.id) ?? []
						const phaseOptions = optionsByPhase.get(phase.id) ?? fallbackOptions
						return phaseQuestions.map((question) => {
							technicalCounter += 1
							return {
								phaseId: phase.id,
								questionType: 'technical' as const,
								questionNumber: technicalCounter,
								title: question.prompt,
								options: phaseOptions,
							}
						})
					})

					phase2TechnicalByPillar[pillar] = technicalQuestions
				})

				const statePhases = phases.filter(
					(phase) => phase.phaseType === 'phase2_state',
				)
				let stateCounter = 0
				const phase2StateQuestions: DiagnosticPhase2QuestionBlueprint[] =
					statePhases.flatMap((phase) => {
						const phaseQuestions = questionsByPhase.get(phase.id) ?? []
						const phaseOptions = optionsByPhase.get(phase.id) ?? fallbackOptions
						return phaseQuestions.map((question) => {
							stateCounter += 1
							return {
								phaseId: phase.id,
								questionType: 'state' as const,
								questionNumber: stateCounter,
								title: question.prompt,
								options: phaseOptions,
							}
						})
					})

				const reflectionPhases = phases.filter(
					(phase) => phase.phaseType === 'protocol_reflection',
				)
				const protocolReflections = reflectionPhases.flatMap((phase) =>
					(questionsByPhase.get(phase.id) ?? []).map((item) => item.prompt),
				)

				const actionPhases = phases
					.filter((phase) => phase.phaseType === 'protocol_action')
					.sort(
						(a, b) =>
							(a.blockNumber ?? a.orderIndex) - (b.blockNumber ?? b.orderIndex),
					)

				const protocolActionBlocks = actionPhases
					.map((phase, index) => {
						const blockNumber = phase.blockNumber ?? index + 1
						const block: 1 | 2 | 3 =
							blockNumber === 2 ? 2 : blockNumber >= 3 ? 3 : 1
						return {
							block,
							title: phase.title,
							actions: (questionsByPhase.get(phase.id) ?? []).map(
								(item) => item.prompt,
							),
						}
					})
					.filter((block) => block.actions.length > 0)

				return {
					source: 'dynamic',
					nicheName: niche.name,
					phase1Pillars,
					totalPhase1Questions: phase1Pillars.reduce(
						(total, pillar) => total + pillar.questions.length,
						0,
					),
					getPhase2Questions: (pillar) => [
						...phase2TechnicalByPillar[pillar],
						...phase2StateQuestions,
					],
					protocolReflections:
						protocolReflections.length > 0
							? protocolReflections
							: [...PROTOCOL_REFLECTION_PROMPTS],
					protocolActionBlocks:
						protocolActionBlocks.length > 0
							? protocolActionBlocks
							: [...PROTOCOL_ACTION_BLOCKS],
				}
			} catch {
				return fallbackBlueprint
			}
		},
	})
}
