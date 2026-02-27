import { BrainCircuit } from 'lucide-react'

export const AppLogo = () => (
	<div className="inline-flex items-center gap-2">
		<span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_42%,transparent)]">
			<BrainCircuit className="size-5" />
		</span>
		<div className="leading-none">
			<strong className="font-[var(--font-space)] text-base font-extrabold tracking-wide">
				CORTEX
			</strong>
			<p className="text-[11px] text-muted-foreground">
				Diagnóstico de Projetos
			</p>
		</div>
	</div>
)
