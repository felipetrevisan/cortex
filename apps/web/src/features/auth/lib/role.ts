export const normalizeRole = (value: unknown): string => {
	if (typeof value !== 'string') return ''
	return value.trim().toLowerCase()
}

export const isAdminRole = (value: unknown): boolean => {
	const normalized = normalizeRole(value)
	return (
		normalized === 'admin' ||
		normalized === 'administrator' ||
		normalized === 'administrador'
	)
}

const normalizeEmail = (value: unknown): string => {
	if (typeof value !== 'string') return ''
	return value.trim().toLowerCase()
}

const getAllowlistedAdminEmails = (): string[] =>
	(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
		.split(',')
		.map((entry) => normalizeEmail(entry))
		.filter(Boolean)

interface AdminResolutionInput {
	profileRole?: unknown
	appMetadataRole?: unknown
	userMetadataRole?: unknown
	email?: unknown
}

export const resolveIsAdmin = ({
	profileRole,
	appMetadataRole,
	userMetadataRole,
	email,
}: AdminResolutionInput): boolean => {
	if (
		isAdminRole(profileRole) ||
		isAdminRole(appMetadataRole) ||
		isAdminRole(userMetadataRole)
	) {
		return true
	}

	const normalizedEmail = normalizeEmail(email)
	if (!normalizedEmail) return false

	return getAllowlistedAdminEmails().includes(normalizedEmail)
}
