'use client'

import {
	type DiagnosticNicheModel,
	type DiagnosticPhaseModel,
	type DiagnosticPhaseOptionModel,
	type DiagnosticPhaseQuestionModel,
	mapDiagnosticNiche,
	mapDiagnosticPhase,
	mapDiagnosticPhaseOption,
	mapDiagnosticPhaseQuestion,
} from '@cortex/shared/models/diagnostic-config.model'
import type {
	TablesInsert,
	TablesUpdate,
} from '@cortex/shared/supabase/database.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminConfigViewModel {
	niches: DiagnosticNicheModel[]
	phases: DiagnosticPhaseModel[]
	questions: DiagnosticPhaseQuestionModel[]
	options: DiagnosticPhaseOptionModel[]
}

const normalizeSlug = (value: string): string =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '')

export const useAdminConfig = () => {
	const queryClient = useQueryClient()

	const configQuery = useQuery({
		queryKey: queryKeys.admin.config,
		queryFn: async (): Promise<AdminConfigViewModel> => {
			const supabase = getSupabaseClient()

			const [
				{ data: nichesRows, error: nichesError },
				{ data: phasesRows, error: phasesError },
				{ data: questionsRows, error: questionsError },
				{ data: optionsRows, error: optionsError },
			] = await Promise.all([
				supabase
					.from('diagnostic_niches')
					.select('*')
					.order('created_at', { ascending: true }),
				supabase
					.from('diagnostic_phases')
					.select('*')
					.order('order_index', { ascending: true })
					.order('created_at', { ascending: true }),
				supabase
					.from('diagnostic_phase_questions')
					.select('*')
					.order('order_index', { ascending: true })
					.order('created_at', { ascending: true }),
				supabase
					.from('diagnostic_phase_options')
					.select('*')
					.order('order_index', { ascending: true })
					.order('created_at', { ascending: true }),
			])

			if (nichesError) throw new Error(nichesError.message)
			if (phasesError) throw new Error(phasesError.message)
			if (questionsError) throw new Error(questionsError.message)
			if (optionsError) throw new Error(optionsError.message)

			return {
				niches: (nichesRows ?? []).map(mapDiagnosticNiche),
				phases: (phasesRows ?? []).map(mapDiagnosticPhase),
				questions: (questionsRows ?? []).map(mapDiagnosticPhaseQuestion),
				options: (optionsRows ?? []).map(mapDiagnosticPhaseOption),
			}
		},
	})

	const invalidateAll = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.config }),
			queryClient.invalidateQueries({ queryKey: ['diagnostic', 'blueprint'] }),
		])
	}

	const createNiche = useMutation({
		mutationFn: async (payload: {
			name: string
			description?: string | null
		}) => {
			const insertPayload: TablesInsert<'diagnostic_niches'> = {
				name: payload.name.trim(),
				slug: normalizeSlug(payload.name),
				description: payload.description?.trim() || null,
				is_active: true,
			}

			const { error } = await getSupabaseClient()
				.from('diagnostic_niches')
				.insert(insertPayload)
			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			toast.success('Nicho criado com sucesso.')
			await invalidateAll()
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const updateNiche = useMutation({
		mutationFn: async (payload: {
			id: string
			data: TablesUpdate<'diagnostic_niches'>
		}) => {
			const { error } = await getSupabaseClient()
				.from('diagnostic_niches')
				.update(payload.data)
				.eq('id', payload.id)

			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			toast.success('Nicho atualizado.')
			await invalidateAll()
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const createPhase = useMutation({
		mutationFn: async (payload: TablesInsert<'diagnostic_phases'>) => {
			const { error } = await getSupabaseClient()
				.from('diagnostic_phases')
				.insert(payload)
			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			toast.success('Fase cadastrada.')
			await invalidateAll()
		},
		onError: (error) => toast.error(error.message),
	})

	const createQuestion = useMutation({
		mutationFn: async (payload: TablesInsert<'diagnostic_phase_questions'>) => {
			const { error } = await getSupabaseClient()
				.from('diagnostic_phase_questions')
				.insert(payload)
			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			toast.success('Pergunta cadastrada.')
			await invalidateAll()
		},
		onError: (error) => toast.error(error.message),
	})

	const createOption = useMutation({
		mutationFn: async (payload: TablesInsert<'diagnostic_phase_options'>) => {
			const { error } = await getSupabaseClient()
				.from('diagnostic_phase_options')
				.insert(payload)
			if (error) throw new Error(error.message)
		},
		onSuccess: async () => {
			toast.success('Opção cadastrada.')
			await invalidateAll()
		},
		onError: (error) => toast.error(error.message),
	})

	return {
		configQuery,
		createNiche,
		updateNiche,
		createPhase,
		createQuestion,
		createOption,
	}
}
