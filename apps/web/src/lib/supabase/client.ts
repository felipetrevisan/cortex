'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type AppDatabase, SUPABASE_DB_SCHEMA } from './schema'

let client: ReturnType<
	typeof createBrowserClient<AppDatabase, typeof SUPABASE_DB_SCHEMA>
> | null = null

const getClientEnv = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
	const anonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

	if (!url || !anonKey) {
		throw new Error(
			'Supabase env ausente no CLIENT. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) em apps/web/.env.local e reinicie o dev server.',
		)
	}

	return { url, anonKey }
}

export const getSupabaseClient = () => {
	if (!client) {
		const env = getClientEnv()
		client = createBrowserClient<AppDatabase, typeof SUPABASE_DB_SCHEMA>(
			env.url,
			env.anonKey,
			{
				db: {
					schema: SUPABASE_DB_SCHEMA,
				},
			},
		)
	}
	return client
}
