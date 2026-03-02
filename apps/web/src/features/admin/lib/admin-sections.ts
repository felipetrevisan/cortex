export type AdminSection = 'niches' | 'phases' | 'questions' | 'users'

export const adminSectionPath: Record<AdminSection, string> = {
	niches: '/admin/niches',
	phases: '/admin/phases',
	questions: '/admin/questions',
	users: '/admin/users',
}

export const resolveAdminSectionFromPathname = (
	pathname: string,
): AdminSection => {
	if (pathname.startsWith('/admin/phases')) return 'phases'
	if (pathname.startsWith('/admin/questions')) return 'questions'
	if (pathname.startsWith('/admin/users')) return 'users'
	return 'niches'
}
