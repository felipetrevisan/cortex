'use client'

import {
	mapProfile,
	type ProfileModel,
} from '@cortex/shared/models/profile.model'
import { useQuery } from '@tanstack/react-query'
import { isAdminRole, normalizeRole } from '@/features/auth/lib/role'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '../components/auth-provider'

const toFallbackProfile = (
	userId: string,
	fallbackName: string,
	fallbackRole?: unknown,
	fallbackAvatarUrl?: string | null,
	activeNicheId?: string | null,
): ProfileModel => ({
	id: userId,
	userId,
	fullName: fallbackName,
	role: normalizeRole(fallbackRole) || 'user',
	avatarUrl: fallbackAvatarUrl?.trim() || null,
	activeNicheId: activeNicheId ?? null,
	createdAt: new Date(),
	updatedAt: new Date(),
})

export const useProfileQuery = () => {
	const { user } = useAuth()

	return useQuery({
		queryKey: queryKeys.auth.profile(user?.id ?? 'anon'),
		enabled: Boolean(user?.id),
		meta: { persist: false },
		staleTime: 0,
		networkMode: 'always',
		retry: 0,
		refetchOnMount: 'always',
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		queryFn: async (): Promise<ProfileModel> => {
			if (!user?.id) {
				throw new Error('Usuário não autenticado')
			}

			const supabase = getSupabaseClient()
			const { data, error } = await supabase
				.from('profiles')
				.select(
					'id, user_id, full_name, role, avatar_url, active_niche_id, email, auth_provider, is_deleted, deleted_at, created_at, updated_at',
				)
				.eq('user_id', user.id)
				.maybeSingle()

			const fallbackName =
				(user.user_metadata.full_name as string | undefined) ??
				user.email ??
				'Usuário'
			const fallbackRole = user.app_metadata?.role ?? user.user_metadata?.role
			const fallbackAvatarUrl =
				(user.user_metadata.avatar_url as string | undefined) ??
				(user.user_metadata.picture as string | undefined) ??
				null

			if (error) {
				console.warn('[auth] Falha ao consultar profiles', {
					code: error.code,
					message: error.message,
				})
				return toFallbackProfile(
					user.id,
					fallbackName,
					fallbackRole,
					fallbackAvatarUrl,
					null,
				)
			}

			if (!data) {
				const roleToPersist = isAdminRole(fallbackRole) ? 'admin' : 'user'

				await supabase.from('profiles').upsert(
					{
						user_id: user.id,
						full_name: fallbackName,
						role: roleToPersist,
						avatar_url: fallbackAvatarUrl,
						email: user.email ?? null,
						auth_provider:
							typeof user.app_metadata?.provider === 'string'
								? user.app_metadata.provider
								: 'email',
					},
					{ onConflict: 'user_id' },
				)

				return toFallbackProfile(
					user.id,
					fallbackName,
					roleToPersist,
					fallbackAvatarUrl,
					null,
				)
			}

			let profile: ProfileModel
			try {
				profile = mapProfile(data)
			} catch {
				const fallbackRoleFromRow =
					typeof data.role === 'string' && data.role.trim().length > 0
						? data.role
						: fallbackRole
				return toFallbackProfile(
					user.id,
					typeof data.full_name === 'string' && data.full_name.trim().length > 0
						? data.full_name
						: fallbackName,
					fallbackRoleFromRow,
					typeof data.avatar_url === 'string'
						? data.avatar_url
						: fallbackAvatarUrl,
					typeof data.active_niche_id === 'string'
						? data.active_niche_id
						: null,
				)
			}

			if (!profile.avatarUrl && fallbackAvatarUrl) {
				return {
					...profile,
					avatarUrl: fallbackAvatarUrl,
				}
			}

			return profile
		},
	})
}
