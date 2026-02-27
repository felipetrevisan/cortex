'use client'

import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@cortex/ui/components/dropdown-menu'
import { cn } from '@cortex/ui/lib/cn'
import {
	Camera,
	ChevronDown,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Shield,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatedDropdownContent } from '@/components/animated-ui/animated-dropdown-content'
import { AppLogo } from '@/components/layout/app-logo'
import { OfflinePill } from '@/components/layout/offline-pill'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserAvatar } from '@/components/layout/user-avatar'
import { useAuth } from '@/features/auth/components/auth-provider'

interface DashboardHeaderProps {
	name: string
	isAdmin?: boolean
	avatarUrl?: string | null | undefined
	onEditAvatar?: () => void
}

interface AccountMenuItem {
	icon: LucideIcon
	id: string
	label: string
	onSelect: () => void | Promise<void>
	tone?: 'default' | 'danger'
}

export const DashboardHeader = ({
	name,
	isAdmin = false,
	avatarUrl,
	onEditAvatar,
}: DashboardHeaderProps) => {
	const router = useRouter()
	const pathname = usePathname()
	const { signOut } = useAuth()

	const handleSignOut = async () => {
		await signOut()
		router.replace('/login')
	}

	const menuItems: AccountMenuItem[] = []

	if (onEditAvatar) {
		menuItems.push({
			icon: Camera,
			id: 'edit-avatar',
			label: 'Atualizar foto',
			onSelect: onEditAvatar,
		})
	}

	if (isAdmin && !pathname.startsWith('/admin')) {
		menuItems.push({
			icon: Shield,
			id: 'admin',
			label: 'Painel Administrador',
			onSelect: () => router.push('/admin/niches'),
		})
	}

	if (pathname !== '/dashboard') {
		menuItems.push({
			icon: LayoutDashboard,
			id: 'overview',
			label: 'Visão Geral',
			onSelect: () => router.push('/dashboard'),
		})
	}

	menuItems.push({
		icon: LogOut,
		id: 'logout',
		label: 'Sair',
		onSelect: handleSignOut,
		tone: 'danger',
	})

	return (
		<header className="sticky top-0 z-40 border-b border-border/65 bg-background/70 backdrop-blur-md">
			<div
				className={cn(
					'flex h-18 items-center justify-between gap-3',
					pathname.startsWith('/admin')
						? 'mx-auto w-[min(1560px,calc(100%-2rem))]'
						: 'cortex-container',
				)}
			>
				<AppLogo />

				<div className="flex items-center gap-2 md:gap-3">
					<OfflinePill />
					<ThemeToggle />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="group inline-flex max-w-[240px] items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2.5 py-1.5 text-sm text-foreground shadow-[0_6px_18px_rgba(2,8,23,0.08)] transition hover:bg-accent/60"
							>
								<UserAvatar
									name={name}
									avatarUrl={avatarUrl ?? null}
									size="sm"
									className="size-6 border-border/60"
								/>
								<span className="truncate text-[13px] font-medium">{name}</span>
								<ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition group-data-[state=open]:rotate-180" />
							</button>
						</DropdownMenuTrigger>

						<AnimatedDropdownContent align="end" className="w-56">
							<DropdownMenuLabel>Menu da Conta</DropdownMenuLabel>

							{menuItems.map((item) => {
								const Icon = item.icon
								const isDanger = item.tone === 'danger'

								return (
									<div key={item.id}>
										{isDanger ? <DropdownMenuSeparator /> : null}
										<DropdownMenuItem
											className={cn(
												'rounded-lg border-0 bg-transparent px-3 py-2.5 text-[13px] text-foreground transition-colors',
												'hover:bg-[var(--primary-soft)] hover:text-primary',
												'focus:bg-[var(--primary-soft)] focus:text-primary',
												'data-[highlighted]:bg-[var(--primary-soft)] data-[highlighted]:text-primary',
												isDanger &&
													'text-rose-600 hover:bg-rose-500/15 hover:text-rose-700 focus:bg-rose-500/15 focus:text-rose-700 data-[highlighted]:bg-rose-500/15 data-[highlighted]:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200 dark:focus:text-rose-200 dark:data-[highlighted]:text-rose-200',
											)}
											onSelect={() => void item.onSelect()}
										>
											<Icon className="size-4" />
											<span>{item.label}</span>
										</DropdownMenuItem>
									</div>
								)
							})}
						</AnimatedDropdownContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	)
}
