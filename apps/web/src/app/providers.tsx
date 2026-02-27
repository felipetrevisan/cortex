'use client'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { createQueryClient } from '@/lib/query/client'

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
	const [queryClient] = useState(createQueryClient)
	const [isMounted, setIsMounted] = useState(false)

	useServiceWorker()

	useEffect(() => {
		setIsMounted(true)
	}, [])

	if (!isMounted) {
		return (
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<AuthProvider>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				</AuthProvider>
			</ThemeProvider>
		)
	}

	const persister = createAsyncStoragePersister({
		storage: window.localStorage,
		key: 'cortex-query-cache',
	})

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AuthProvider>
				<PersistQueryClientProvider
					client={queryClient}
					persistOptions={{
						persister,
						maxAge: 1000 * 60 * 60 * 24,
						dehydrateOptions: {
							shouldDehydrateQuery: (query) => query.meta?.persist !== false,
						},
					}}
				>
					{children}
					<Toaster
						position="top-right"
						richColors
						closeButton
						toastOptions={{ className: 'font-[var(--font-manrope)]' }}
					/>
					<ReactQueryDevtools initialIsOpen={false} />
				</PersistQueryClientProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
