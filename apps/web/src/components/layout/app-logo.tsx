import { cn } from '@cortex/ui/lib/cn'

type AppLogoVariant = 'premium' | 'tech'

interface AppLogoProps {
	className?: string
	variant?: AppLogoVariant
}

const PremiumMark = () => (
	<span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.68)_48%,rgba(59,130,246,0.28)_100%)] shadow-[0_10px_28px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.04)] dark:border-white/12 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.95)_0%,rgba(15,23,42,0.86)_52%,rgba(37,99,235,0.34)_100%)] dark:shadow-[0_14px_36px_rgba(2,6,23,0.48),0_0_0_1px_rgba(255,255,255,0.03)]">
		<svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="size-8">
			<defs>
				<linearGradient id="premium-ring" x1="13" y1="13" x2="51" y2="49">
					<stop offset="0%" stopColor="#f8fafc" stopOpacity="0.96" />
					<stop offset="55%" stopColor="#93c5fd" stopOpacity="0.94" />
					<stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.84" />
				</linearGradient>
				<radialGradient
					id="premium-core"
					cx="0"
					cy="0"
					r="1"
					gradientTransform="translate(32 32) rotate(90) scale(18)"
				>
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="42%" stopColor="#e0f2fe" />
					<stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
				</radialGradient>
			</defs>

			<path
				d="M45.5 18.5C42.8 15.7 38.7 14 34.1 14C25.8 14 19 20.7 19 29C19 37.3 25.8 44 34.1 44C38.7 44 42.8 42.3 45.5 39.5"
				stroke="url(#premium-ring)"
				strokeWidth="6"
				strokeLinecap="round"
			/>
			<circle cx="34" cy="29" r="10" fill="url(#premium-core)" />
			<circle cx="47" cy="20" r="2.5" fill="white" fillOpacity="0.95" />
			<circle cx="47" cy="38" r="2.5" fill="#c4b5fd" fillOpacity="0.95" />
			<path
				d="M24 23.5L29 26.5M24 34.5L29 31.5M39 26.5L44 23.5M39 31.5L44 34.5"
				stroke="white"
				strokeOpacity="0.78"
				strokeWidth="2.4"
				strokeLinecap="round"
			/>
		</svg>
	</span>
)

const TechMark = () => (
	<span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/30 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.28),transparent_32%),linear-gradient(145deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.94)_48%,rgba(76,29,149,0.78)_100%)] shadow-[0_0_28px_rgba(59,130,246,0.18),0_0_44px_rgba(168,85,247,0.12)]">
		<span className="absolute inset-[3px] rounded-[14px] border border-white/8" />
		<svg
			viewBox="0 0 64 64"
			fill="none"
			aria-hidden="true"
			className="relative size-8"
		>
			<defs>
				<linearGradient id="tech-orbit" x1="10" y1="10" x2="54" y2="54">
					<stop offset="0%" stopColor="#67e8f9" />
					<stop offset="50%" stopColor="#60a5fa" />
					<stop offset="100%" stopColor="#c084fc" />
				</linearGradient>
				<radialGradient
					id="tech-core"
					cx="0"
					cy="0"
					r="1"
					gradientTransform="translate(32 32) rotate(90) scale(15)"
				>
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="38%" stopColor="#e9d5ff" />
					<stop offset="100%" stopColor="#38bdf8" stopOpacity="0.12" />
				</radialGradient>
			</defs>

			<circle
				cx="32"
				cy="32"
				r="17"
				stroke="url(#tech-orbit)"
				strokeWidth="4.5"
				strokeDasharray="72 34"
				strokeLinecap="round"
			/>
			<ellipse
				cx="32"
				cy="32"
				rx="22"
				ry="10.5"
				stroke="url(#tech-orbit)"
				strokeWidth="2.8"
				strokeOpacity="0.9"
				transform="rotate(24 32 32)"
			/>
			<ellipse
				cx="32"
				cy="32"
				rx="22"
				ry="10.5"
				stroke="url(#tech-orbit)"
				strokeWidth="2.8"
				strokeOpacity="0.7"
				transform="rotate(-26 32 32)"
			/>
			<circle cx="32" cy="32" r="8.5" fill="url(#tech-core)" />
			<circle cx="49" cy="26" r="2.6" fill="#67e8f9" />
			<circle cx="18" cy="37" r="2.3" fill="#c084fc" />
			<circle cx="32" cy="13" r="2.1" fill="#bfdbfe" />
		</svg>
	</span>
)

const variantLabel = {
	premium: 'Diagnóstico de Projetos',
	tech: 'Inteligência Estrutural Adaptativa',
} satisfies Record<AppLogoVariant, string>

export const AppLogo = ({ className, variant = 'premium' }: AppLogoProps) => (
	<div className={cn('inline-flex items-center gap-2.5', className)}>
		{variant === 'tech' ? <TechMark /> : <PremiumMark />}
		<div className="leading-none">
			<strong className="font-[var(--font-space)] text-base font-extrabold tracking-[0.16em]">
				CORTEX
			</strong>
			<p className="mt-1 text-[11px] text-muted-foreground">
				{variantLabel[variant]}
			</p>
		</div>
	</div>
)
