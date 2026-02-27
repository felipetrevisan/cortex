'use client'

import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AuthContextValue {
	user: User | null
	session: Session | null
	isLoading: boolean
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const supabase = getSupabaseClient()

		const bootstrapAuth = async () => {
			const { data } = await supabase.auth.getSession()
			setSession(data.session ?? null)

			if (data.session?.user) {
				setUser(data.session.user)
				setIsLoading(false)
				return
			}

			const userResult = await supabase.auth.getUser()
			setUser(userResult.data.user ?? null)
			setIsLoading(false)
		}

		bootstrapAuth()

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession)
			setUser(nextSession?.user ?? null)
			setIsLoading(false)
		})

		return () => subscription.unsubscribe()
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			session,
			isLoading,
			signOut: async () => {
				await getSupabaseClient().auth.signOut()
			},
		}),
		[isLoading, session, user],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth precisa ser usado dentro de AuthProvider')
	}
	return context
}
