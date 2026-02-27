'use client'

import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60,
				gcTime: 1000 * 60 * 30,
				retry: 1,
				refetchOnWindowFocus: false,
				networkMode: 'offlineFirst',
			},
			mutations: {
				networkMode: 'offlineFirst',
			},
		},
	})
