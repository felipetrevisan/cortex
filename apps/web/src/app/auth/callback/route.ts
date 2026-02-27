import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { type AppDatabase, SUPABASE_DB_SCHEMA } from '@/lib/supabase/schema'

const getRouteEnv = () => {
	const url = (
		process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
	)?.trim()
	const anonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
		process.env.SUPABASE_ANON_KEY?.trim() ||
		process.env.SUPABASE_PUBLISHABLE_KEY?.trim()

	if (!url || !anonKey) {
		throw new Error('Supabase env ausente no callback OAuth.')
	}

	return { url, anonKey }
}

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get('code')
	const oauthError = requestUrl.searchParams.get('error')
	const oauthErrorCode = requestUrl.searchParams.get('error_code')
	const oauthErrorDescription = requestUrl.searchParams.get('error_description')
	const next = requestUrl.searchParams.get('next')
	const safeNext = next?.startsWith('/') ? next : '/dashboard'
	const redirectResponse = NextResponse.redirect(new URL(safeNext, request.url))

	if (oauthError) {
		const errorUrl = new URL('/login', request.url)
		errorUrl.searchParams.set('error', oauthError)
		if (oauthErrorCode) errorUrl.searchParams.set('error_code', oauthErrorCode)
		if (oauthErrorDescription) {
			errorUrl.searchParams.set('error_description', oauthErrorDescription)
		}
		return NextResponse.redirect(errorUrl)
	}

	if (code) {
		try {
			const env = getRouteEnv()
			const supabase = createServerClient<
				AppDatabase,
				typeof SUPABASE_DB_SCHEMA
			>(env.url, env.anonKey, {
				db: {
					schema: SUPABASE_DB_SCHEMA,
				},
				cookies: {
					getAll() {
						return request.cookies.getAll()
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value, options }) => {
							redirectResponse.cookies.set(name, value, options)
						})
					},
				},
			})

			const { error } = await supabase.auth.exchangeCodeForSession(code)
			if (error) {
				const errorUrl = new URL('/login', request.url)
				errorUrl.searchParams.set('error', 'oauth_callback')
				return NextResponse.redirect(errorUrl)
			}
		} catch {
			const errorUrl = new URL('/login', request.url)
			errorUrl.searchParams.set('error', 'oauth_env')
			return NextResponse.redirect(errorUrl)
		}
	}

	return redirectResponse
}
