import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type AppDatabase, SUPABASE_DB_SCHEMA } from './schema'

const getServerEnv = () => {
	const url = (
		process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
	)?.trim()
	const anonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
		process.env.SUPABASE_ANON_KEY?.trim() ||
		process.env.SUPABASE_PUBLISHABLE_KEY?.trim()

	if (!url || !anonKey) {
		throw new Error(
			'Supabase env ausente no SERVER. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) em apps/web/.env.local e reinicie o servidor.',
		)
	}

	return { url, anonKey }
}

export const createSupabaseServerClient = async () => {
	const env = getServerEnv()
	const cookieStore = await cookies()

	return createServerClient<AppDatabase, typeof SUPABASE_DB_SCHEMA>(
		env.url,
		env.anonKey,
		{
			db: {
				schema: SUPABASE_DB_SCHEMA,
			},
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options)
						})
					} catch {
						// Server components can be read-only for cookies. Ignore in that scenario.
					}
				},
			},
		},
	)
}
