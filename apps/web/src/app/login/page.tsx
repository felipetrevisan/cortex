import { LoginScreen } from '@/features/auth/components/login-screen'

interface LoginPageProps {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const asString = (value: string | string[] | undefined): string | null => {
	if (typeof value === 'string') return value
	if (Array.isArray(value) && value.length > 0) return value[0] ?? null
	return null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const params = (await searchParams) ?? {}
	const oauthError = asString(params.error)
	const oauthErrorCode = asString(params.error_code)
	const oauthErrorDescription = asString(params.error_description)

	const oauthErrorMessage = oauthError
		? `Falha no login Google (${oauthErrorCode ?? oauthError}). ${oauthErrorDescription ?? 'Verifique a configuração do provider no Supabase e Google Cloud.'}`
		: null

	return <LoginScreen oauthErrorMessage={oauthErrorMessage} />
}
