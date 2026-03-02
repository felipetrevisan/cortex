import { cn } from '@cortex/ui/lib/cn'
import Image from 'next/image'

type AppLogoSurface = 'auto' | 'dark' | 'light'
type AppLogoSize = 'sm' | 'md' | 'lg'

interface AppLogoProps {
	className?: string
	showTagline?: boolean
	size?: AppLogoSize
	surface?: AppLogoSurface
}

const sizeClasses = {
	sm: {
		icon: 'size-10',
		title: 'text-base tracking-[0.14em]',
		tagline: 'text-[11px]',
	},
	md: {
		icon: 'size-11',
		title: 'text-lg tracking-[0.16em]',
		tagline: 'text-xs',
	},
	lg: {
		icon: 'size-12',
		title: 'text-xl tracking-[0.18em]',
		tagline: 'text-[13px]',
	},
} satisfies Record<
	AppLogoSize,
	{
		icon: string
		title: string
		tagline: string
	}
>

const officialLogoSize = 1080

const LogoMark = ({
	size,
	surface,
}: {
	size: AppLogoSize
	surface: AppLogoSurface
}) => {
	const iconClassName = cn(
		'relative shrink-0 overflow-hidden rounded-2xl',
		sizeClasses[size].icon,
	)

	if (surface === 'dark') {
		return (
			<span className={iconClassName}>
				<Image
					src="/brand/logo-white.png"
					alt="CORTEX"
					width={officialLogoSize}
					height={officialLogoSize}
					className="size-full object-contain"
					priority
				/>
			</span>
		)
	}

	if (surface === 'light') {
		return (
			<span className={iconClassName}>
				<Image
					src="/brand/logo-black.png"
					alt="CORTEX"
					width={officialLogoSize}
					height={officialLogoSize}
					className="size-full object-contain"
					priority
				/>
			</span>
		)
	}

	return (
		<span className={iconClassName}>
			<Image
				src="/brand/logo-black.png"
				alt="CORTEX"
				width={officialLogoSize}
				height={officialLogoSize}
				className="size-full object-contain dark:hidden"
				priority
			/>
			<Image
				src="/brand/logo-white.png"
				alt="CORTEX"
				width={officialLogoSize}
				height={officialLogoSize}
				className="hidden size-full object-contain dark:block"
				priority
			/>
		</span>
	)
}

export const AppLogo = ({
	className,
	showTagline = false,
	size = 'md',
	surface = 'auto',
}: AppLogoProps) => {
	const isDarkSurface = surface === 'dark'

	return (
		<div className={cn('inline-flex items-center gap-3', className)}>
			<LogoMark size={size} surface={surface} />
			<div className="leading-none">
				<strong
					className={cn(
						'font-extrabold uppercase',
						sizeClasses[size].title,
						isDarkSurface ? 'text-white' : 'text-foreground',
					)}
				>
					CORTEX
				</strong>
				{showTagline ? (
					<p
						className={cn(
							'mt-1.5 font-medium',
							sizeClasses[size].tagline,
							isDarkSurface ? 'text-slate-200/88' : 'text-muted-foreground',
						)}
					>
						Sistema de Diagnóstico para Conclusão de Projetos
					</p>
				) : null}
			</div>
		</div>
	)
}
