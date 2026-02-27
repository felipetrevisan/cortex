export const queryKeys = {
	auth: {
		session: ['auth', 'session'] as const,
		profile: (userId: string) => ['auth', 'profile', userId] as const,
		nicheAccess: (userId: string) => ['auth', 'niche-access', userId] as const,
	},
	dashboard: {
		cycle: (userId: string, nicheId: string) =>
			['dashboard', 'cycle', userId, nicheId] as const,
		cycles: (userId: string, nicheId: string) =>
			['dashboard', 'cycles', userId, nicheId] as const,
		protocol: (userId: string, nicheId: string) =>
			['dashboard', 'protocol', userId, nicheId] as const,
	},
	diagnostic: {
		blueprint: (nicheId: string) =>
			['diagnostic', 'blueprint', nicheId] as const,
	},
	admin: {
		config: ['admin', 'config'] as const,
		users: ['admin', 'users'] as const,
	},
}
