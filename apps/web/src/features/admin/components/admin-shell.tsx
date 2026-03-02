'use client'

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@cortex/ui/components/sheet'
import { Loader2, Menu, ShieldAlert } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { SlidingNumber } from '@/components/animate-ui/components/sliding-number'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarInset,
	SidebarProvider,
} from '@/components/ui/sidebar'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
import { useAdminAccess } from '../hooks/use-admin-access'
import { useAdminConfig } from '../hooks/use-admin-config'
import { useAdminUsers } from '../hooks/use-admin-users'
import {
	adminSectionPath,
	resolveAdminSectionFromPathname,
} from '../lib/admin-sections'
import { AdminNavigation } from './admin-navigation'

export const AdminShell = ({ children }: { children: ReactNode }) => {
	const access = useAdminAccess()
	const config = useAdminConfig()
	const adminUsers = useAdminUsers()
	const pathname = usePathname()
	const router = useRouter()
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

	const activeSection = useMemo(
		() => resolveAdminSectionFromPathname(pathname),
		[pathname],
	)

	const setActiveSection = (section: keyof typeof adminSectionPath) => {
		router.push(adminSectionPath[section])
		setIsMobileNavOpen(false)
	}

	const configData = config.configQuery.data
	const usersData = adminUsers.usersQuery.data

	if (
		access.isLoading ||
		config.configQuery.isLoading ||
		adminUsers.usersQuery.isLoading
	) {
		return (
			<main className="grid min-h-dvh place-items-center">
				<Loader2 className="size-6 animate-spin text-primary" />
			</main>
		)
	}

	if (config.configQuery.error || adminUsers.usersQuery.error) {
		return (
			<main className="min-h-dvh">
				<DashboardHeader
					name={access.profile?.fullName ?? 'Admin'}
					avatarUrl={access.profile?.avatarUrl ?? null}
					isAdmin
				/>
				<section className="cortex-container py-8">
					<Card className="rounded-3xl border-red-500/30 bg-red-500/10">
						<CardHeader>
							<CardTitle>Configuração do banco pendente</CardTitle>
							<CardDescription>
								A estrutura necessária para este painel ainda não está
								disponível neste ambiente. Conclua a configuração interna do
								sistema para liberar os recursos administrativos.
							</CardDescription>
						</CardHeader>
					</Card>
				</section>
			</main>
		)
	}

	if (!access.isAdmin) {
		return (
			<main className="min-h-dvh">
				<DashboardHeader
					name={access.profile?.fullName ?? 'Usuário'}
					avatarUrl={access.profile?.avatarUrl ?? null}
					isAdmin={false}
				/>
				<section className="cortex-container py-8">
					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldAlert className="size-5 text-amber-500" />
								Acesso restrito
							</CardTitle>
							<CardDescription>
								Somente usuários com role admin podem acessar este painel.
							</CardDescription>
						</CardHeader>
					</Card>
				</section>
			</main>
		)
	}

	return (
		<main className="min-h-dvh pb-10">
			<DashboardHeader
				name={access.profile?.fullName ?? 'Admin'}
				avatarUrl={access.profile?.avatarUrl ?? null}
				isAdmin
			/>

			<section className="mx-auto mt-8 w-[min(1560px,calc(100%-2rem))]">
				<div className="mb-5 flex items-start justify-end gap-3">
					<button
						type="button"
						onClick={() => setIsMobileNavOpen(true)}
						className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:bg-accent md:hidden"
						aria-label="Abrir menu de navegação"
					>
						<Menu className="size-4.5" />
					</button>
				</div>

				<SidebarProvider className="h-[calc(100dvh-11rem)] min-h-[720px] min-h-0 w-full overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-lg shadow-sm">
					<Sidebar collapsible="none" className="hidden h-full md:flex">
						<SidebarContent className="px-3 py-4">
							<SidebarGroup className="p-0">
								<SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.1em]">
									Configuração
								</SidebarGroupLabel>
								<SidebarGroupContent className="pt-1">
									<AdminNavigation
										activeSection={activeSection}
										onSelectSection={setActiveSection}
									/>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>

						<SidebarFooter className="mt-auto border-t border-sidebar-border p-4">
							<div className="grid gap-2.5 text-xs">
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={configData?.niches.length ?? 0}
										className="font-semibold"
									/>{' '}
									nichos
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={configData?.phases.length ?? 0}
										className="font-semibold"
									/>{' '}
									fases
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={configData?.questions.length ?? 0}
										className="font-semibold"
									/>{' '}
									perguntas
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={configData?.options.length ?? 0}
										className="font-semibold"
									/>{' '}
									opções
								</div>
								<div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
									<SlidingNumber
										value={usersData?.stats.total ?? 0}
										className="font-semibold"
									/>{' '}
									usuários
								</div>
							</div>
						</SidebarFooter>
					</Sidebar>

					<SidebarInset className="h-full min-h-0 overflow-y-auto bg-transparent">
						<div className="w-full min-w-0 space-y-6 p-5 sm:p-7">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</section>

			<Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
				<SheetContent side="left" className="w-[300px] p-0">
					<SheetHeader className="border-b border-border/80 px-4 py-4">
						<SheetTitle className="text-left text-sidebar-foreground">
							Painel Admin
						</SheetTitle>
						<SheetDescription className="text-left text-sidebar-foreground/75">
							Selecione o módulo que deseja editar.
						</SheetDescription>
					</SheetHeader>
					<div className="px-3 py-3">
						<SidebarProvider>
							<Sidebar collapsible="none" className="w-full bg-transparent">
								<SidebarContent className="bg-transparent">
									<SidebarGroup className="p-0">
										<SidebarGroupContent>
											<AdminNavigation
												activeSection={activeSection}
												onSelectSection={setActiveSection}
											/>
										</SidebarGroupContent>
									</SidebarGroup>
								</SidebarContent>
							</Sidebar>
						</SidebarProvider>
					</div>
				</SheetContent>
			</Sheet>
		</main>
	)
}
