'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../components/auth-provider'

interface UseAuthRedirectOptions {
	requireAuth?: boolean
}

export const useAuthRedirect = ({
	requireAuth = false,
}: UseAuthRedirectOptions = {}) => {
	const pathname = usePathname()
	const router = useRouter()
	const { user, session, isLoading } = useAuth()
	const isAuthenticated = Boolean(user || session?.user)

	useEffect(() => {
		if (isLoading) return

		if (requireAuth && !isAuthenticated) {
			router.replace(`/login?next=${encodeURIComponent(pathname)}`)
			return
		}

		if (!requireAuth && isAuthenticated && pathname === '/login') {
			router.replace('/dashboard')
		}
	}, [isAuthenticated, isLoading, pathname, requireAuth, router])

	return { isLoading, isAuthenticated, user: user ?? session?.user ?? null }
}
