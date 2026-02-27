'use client'

import {
	type AdminUserModel,
	mapAdminUser,
	type UserRole,
} from '@cortex/shared/models/admin-user.model'
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

export interface AdminUsersViewModel {
	users: AdminUserModel[]
	stats: AdminUsersStats
}

const buildStats = (users: AdminUserModel[]): AdminUsersStats => {
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
			const { data, error } = await supabase
				.from('profiles')
				.select(
					'id, user_id, full_name, email, role, avatar_url, auth_provider, is_deleted, deleted_at, active_niche_id, created_at, updated_at',
				)
				.order('created_at', { ascending: false })

			if (error) {
				throw new Error(error.message)
			}

			const users = (data ?? []).map(mapAdminUser)
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
				payload.deleted
					? 'Usuário desativado (soft delete).'
					: 'Usuário reativado.',
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

	return {
		usersQuery,
		updateRole,
		setSoftDelete,
	}
}
