'use client'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { createQueryClient } from '@/lib/query/client'

const ThemedToaster = () => {
	const { resolvedTheme } = useTheme()

	return (
		<Toaster
			position="top-right"
			theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
			richColors
			closeButton
			toastOptions={{
				className: 'font-[var(--font-manrope)]',
				classNames: {
					toast:
						'border border-border bg-card text-card-foreground shadow-[0_18px_48px_-24px_color-mix(in_oklch,var(--primary)_38%,transparent)] backdrop-blur-xl',
					title: 'text-sm font-semibold text-card-foreground',
					description: 'text-sm text-muted-foreground',
					content: 'gap-1.5',
					closeButton:
						'cursor-pointer border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
					actionButton:
						'cursor-pointer !bg-primary !text-primary-foreground hover:!bg-primary/90',
					cancelButton:
						'cursor-pointer !border !border-border !bg-secondary !text-secondary-foreground hover:!bg-accent hover:!text-accent-foreground',
					success:
						'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
					error:
						'border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300',
					info: 'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300',
					warning:
						'border-amber-500/30 bg-amber-500/14 text-amber-700 dark:text-amber-300',
					loading: 'border-primary/30 bg-primary-soft text-card-foreground',
					default: 'border border-border bg-card text-card-foreground',
				},
			}}
		/>
	)
}

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
	const [queryClient] = useState(createQueryClient)
	const [isMounted, setIsMounted] = useState(false)

	useServiceWorker()

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		window.localStorage.removeItem('cortex-query-cache')
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
					<ThemedToaster />
					<ReactQueryDevtools initialIsOpen={false} />
				</PersistQueryClientProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
