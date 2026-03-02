'use client'

import {
	type AdminUserModel,
	mapAdminUser,
	type UserRole,
} from '@cortex/shared/models/admin-user.model'
import { mapDiagnosticNiche } from '@cortex/shared/models/diagnostic-config.model'
import { mapUserNicheAccess } from '@cortex/shared/models/user-niche-access.model'
import type { TablesUpdate } from '@cortex/shared/supabase/database.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'

const normalizeProviderKey = (value: string): string => {
	const normalized = value.trim().toLowerCase()
	if (!normalized) return 'email'
	if (normalized === 'google') return 'google'
	if (normalized === 'email') return 'email'
	return normalized
}

export interface AdminUsersStats {
	total: number
	active: number
	deleted: number
	byProvider: Array<{ provider: string; total: number }>
}

export interface AdminUserNicheSummary {
	accessId: string
	nicheId: string
	name: string
	slug: string
	purchasedAt: Date
	expiresAt: Date | null
}

export interface AdminUserViewModel extends AdminUserModel {
	niches: AdminUserNicheSummary[]
}

export interface AdminUsersViewModel {
	users: AdminUserViewModel[]
	stats: AdminUsersStats
}

interface AdminResetFlowResult {
	cycles_deleted?: number
	phase1_deleted?: number
	phase2_deleted?: number
	protocol_deleted?: number
}

const buildStats = (users: AdminUserViewModel[]): AdminUsersStats => {
	const byProviderMap = new Map<string, number>()

	for (const user of users) {
		const providerKey = normalizeProviderKey(user.authProvider)
		byProviderMap.set(providerKey, (byProviderMap.get(providerKey) ?? 0) + 1)
	}

	return {
		total: users.length,
		active: users.filter((user) => !user.isDeleted).length,
		deleted: users.filter((user) => user.isDeleted).length,
		byProvider: [...byProviderMap.entries()]
			.map(([provider, total]) => ({ provider, total }))
			.sort((a, b) => b.total - a.total),
	}
}

export const useAdminUsers = () => {
	const queryClient = useQueryClient()

	const usersQuery = useQuery({
		queryKey: queryKeys.admin.users,
		queryFn: async (): Promise<AdminUsersViewModel> => {
			const supabase = getSupabaseClient()
			const [
				{ data: profileRows, error: profileError },
				{ data: accessRows, error: accessError },
				{ data: nicheRows, error: nicheError },
			] = await Promise.all([
				supabase
					.from('profiles')
					.select(
						'id, user_id, full_name, email, role, avatar_url, auth_provider, is_deleted, deleted_at, active_niche_id, created_at, updated_at',
					)
					.order('created_at', { ascending: false }),
				supabase
					.from('user_niche_access')
					.select('*')
					.eq('status', 'active')
					.order('purchased_at', { ascending: true })
					.order('created_at', { ascending: true }),
				supabase
					.from('diagnostic_niches')
					.select('*')
					.eq('is_active', true)
					.order('created_at', { ascending: true }),
			])

			if (profileError) throw new Error(profileError.message)
			if (accessError) throw new Error(accessError.message)
			if (nicheError) throw new Error(nicheError.message)

			const nicheById = new Map(
				(nicheRows ?? []).map((row) => {
					const niche = mapDiagnosticNiche(row)
					return [niche.id, niche] as const
				}),
			)

			const nicheAccessByUserId = new Map<string, AdminUserNicheSummary[]>()
			for (const row of accessRows ?? []) {
				const access = mapUserNicheAccess(row)
				if (access.expiresAt && access.expiresAt.getTime() < Date.now()) {
					continue
				}

				const niche = nicheById.get(access.nicheId)
				if (!niche) continue

				const list = nicheAccessByUserId.get(access.userId) ?? []
				list.push({
					accessId: access.id,
					nicheId: niche.id,
					name: niche.name,
					slug: niche.slug,
					purchasedAt: access.purchasedAt,
					expiresAt: access.expiresAt,
				})
				nicheAccessByUserId.set(access.userId, list)
			}

			const users = (profileRows ?? []).map((row) => {
				const user = mapAdminUser(row)
				return {
					...user,
					niches: nicheAccessByUserId.get(user.userId) ?? [],
				} satisfies AdminUserViewModel
			})

			return {
				users,
				stats: buildStats(users),
			}
		},
	})

	const updateRole = useMutation({
		mutationFn: async (payload: { userId: string; role: UserRole }) => {
			const updatePayload: TablesUpdate<'profiles'> = { role: payload.role }
			const { error } = await getSupabaseClient()
				.from('profiles')
				.update(updatePayload)
				.eq('user_id', payload.userId)

			if (error) throw new Error(error.message)
		},
		onSuccess: async (_data, payload) => {
			toast.success(
				`Permissão atualizada para ${payload.role === 'admin' ? 'admin' : 'usuário'}.`,
			)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const setSoftDelete = useMutation({
		mutationFn: async (payload: { userId: string; deleted: boolean }) => {
			const updatePayload: TablesUpdate<'profiles'> = payload.deleted
				? { is_deleted: true, deleted_at: new Date().toISOString() }
				: { is_deleted: false, deleted_at: null }

			const { error } = await getSupabaseClient()
				.from('profiles')
				.update(updatePayload)
				.eq('user_id', payload.userId)

			if (error) throw new Error(error.message)
		},
		onSuccess: async (_data, payload) => {
			toast.success(
				payload.deleted ? 'Usuário excluído.' : 'Usuário restaurado.',
			)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const assignNiche = useMutation({
		mutationFn: async (payload: { userId: string; nicheId: string }) => {
			const supabase = getSupabaseClient()
			const purchasedAt = new Date().toISOString()

			const { error: accessError } = await supabase
				.from('user_niche_access')
				.upsert(
					{
						user_id: payload.userId,
						niche_id: payload.nicheId,
						status: 'active',
						source: 'admin_test_access',
						purchased_at: purchasedAt,
						expires_at: null,
					},
					{ onConflict: 'user_id,niche_id' },
				)

			if (accessError) throw new Error(accessError.message)

			const { error: profileError } = await supabase
				.from('profiles')
				.update({ active_niche_id: payload.nicheId })
				.eq('user_id', payload.userId)

			if (profileError) throw new Error(profileError.message)
		},
		onSuccess: async (_data, payload) => {
			toast.success('Nicho liberado para o usuário.')
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.nicheAccess(payload.userId),
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const setActiveNiche = useMutation({
		mutationFn: async (payload: { userId: string; nicheId: string }) => {
			const supabase = getSupabaseClient()
			const { data: accessRow, error: accessError } = await supabase
				.from('user_niche_access')
				.select('id')
				.eq('user_id', payload.userId)
				.eq('niche_id', payload.nicheId)
				.eq('status', 'active')
				.maybeSingle()

			if (accessError) throw new Error(accessError.message)
			if (!accessRow)
				throw new Error('O usuário não possui acesso a este nicho.')

			const { error: profileError } = await supabase
				.from('profiles')
				.update({ active_niche_id: payload.nicheId })
				.eq('user_id', payload.userId)

			if (profileError) throw new Error(profileError.message)
		},
		onSuccess: async (_data, payload) => {
			toast.success('Nicho ativo atualizado.')
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.nicheAccess(payload.userId),
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const revokeNiche = useMutation({
		mutationFn: async (payload: {
			accessId: string
			userId: string
			nicheId: string
		}) => {
			const supabase = getSupabaseClient()

			const { error: accessError } = await supabase
				.from('user_niche_access')
				.update({
					status: 'blocked',
					expires_at: new Date().toISOString(),
				})
				.eq('id', payload.accessId)

			if (accessError) throw new Error(accessError.message)

			const [
				{ data: profileRow, error: profileFetchError },
				{ data: remainingRows, error: remainingError },
			] = await Promise.all([
				supabase
					.from('profiles')
					.select('active_niche_id')
					.eq('user_id', payload.userId)
					.maybeSingle(),
				supabase
					.from('user_niche_access')
					.select('niche_id')
					.eq('user_id', payload.userId)
					.eq('status', 'active')
					.order('purchased_at', { ascending: true })
					.order('created_at', { ascending: true }),
			])

			if (profileFetchError) throw new Error(profileFetchError.message)
			if (remainingError) throw new Error(remainingError.message)

			const remainingNicheIds = (remainingRows ?? [])
				.map((row) => row.niche_id)
				.filter((value): value is string => typeof value === 'string')
			const nextActiveNicheId = remainingNicheIds[0] ?? null
			const shouldUpdateActiveNiche =
				profileRow?.active_niche_id === payload.nicheId ||
				(profileRow?.active_niche_id
					? !remainingNicheIds.includes(profileRow.active_niche_id)
					: false)

			if (shouldUpdateActiveNiche) {
				const { error: profileUpdateError } = await supabase
					.from('profiles')
					.update({ active_niche_id: nextActiveNicheId })
					.eq('user_id', payload.userId)

				if (profileUpdateError) throw new Error(profileUpdateError.message)
			}
		},
		onSuccess: async (_data, payload) => {
			toast.success('Nicho removido do usuário.')
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.nicheAccess(payload.userId),
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	const resetDiagnosticFlow = useMutation({
		mutationFn: async (payload: { userId: string; nicheId: string }) => {
			const { data, error } = await getSupabaseClient().rpc(
				'admin_reset_user_diagnostic_flow',
				{
					target_user_id: payload.userId,
					target_niche_id: payload.nicheId,
				},
			)

			if (error) throw new Error(error.message)

			return (data ?? {}) as AdminResetFlowResult
		},
		onSuccess: async (data, payload) => {
			const cyclesDeleted = data.cycles_deleted ?? 0
			const phase1Deleted = data.phase1_deleted ?? 0
			const phase2Deleted = data.phase2_deleted ?? 0
			const protocolDeleted = data.protocol_deleted ?? 0

			toast.success(
				`Fluxo resetado. ${cyclesDeleted} ciclo(s), ${phase1Deleted} resposta(s) da Fase 1, ${phase2Deleted} da Fase 2 e ${protocolDeleted} protocolo(s) removidos.`,
			)

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.profile(payload.userId),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.auth.nicheAccess(payload.userId),
				}),
				queryClient.invalidateQueries({
					predicate: (query) => {
						const rootKey = query.queryKey[0]
						return rootKey === 'dashboard' || rootKey === 'diagnostic-result'
					},
				}),
			])
		},
		onError: (error) => {
			toast.error(error.message)
		},
	})

	return {
		usersQuery,
		updateRole,
		setSoftDelete,
		assignNiche,
		setActiveNiche,
		revokeNiche,
		resetDiagnosticFlow,
	}
}
