'use client'

import { useAuth } from '@/features/auth/components/auth-provider'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useProfileQuery } from '@/features/auth/hooks/use-profile-query'
import { resolveIsAdmin } from '@/features/auth/lib/role'

export const useAdminAccess = () => {
	const { user } = useAuth()
	const auth = useAuthRedirect({ requireAuth: true })
	const profileQuery = useProfileQuery()

	const isLoading = auth.isLoading || profileQuery.isLoading
	const isAdmin = resolveIsAdmin({
		profileRole: profileQuery.data?.role,
		appMetadataRole: user?.app_metadata?.role,
		userMetadataRole: user?.user_metadata?.role,
		email: user?.email,
	})

	return {
		isLoading,
		isAdmin,
		profile: profileQuery.data ?? null,
		auth,
	}
}
