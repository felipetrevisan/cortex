'use client'

import { Button } from '@cortex/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { Input } from '@cortex/ui/components/input'
import { AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Reveal } from '@/components/animated-ui/reveal'
import { AppLogo } from '@/components/layout/app-logo'
import { useAuthForm } from '../hooks/use-auth-form'
import { useAuthRedirect } from '../hooks/use-auth-redirect'
import { GoogleIcon } from './google-icon'

const headOrbitTracks = [
	{ size: 210, duration: 13, tilt: 14 },
	{ size: 168, duration: 9.5, tilt: -36 },
	{ size: 132, duration: 7.2, tilt: 58 },
] as const

const HeadOrbit = () => (
	<motion.div
		className="pointer-events-none absolute left-[58%] top-[31%] z-10 hidden size-[280px] -translate-x-1/2 -translate-y-1/2 lg:block"
		animate={{ rotate: [0, 1.5, -1.5, 0] }}
		transition={{
			duration: 9,
			repeat: Number.POSITIVE_INFINITY,
			ease: 'easeInOut',
		}}
	>
		<motion.div
			className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(196,181,253,0.24)_0%,rgba(59,130,246,0.1)_40%,rgba(0,0,0,0)_70%)] blur-[1px]"
			animate={{ scale: [1, 1.04, 1] }}
			transition={{
				duration: 2.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
		/>
		{headOrbitTracks.map((orbit, index) => (
			<motion.div
				key={`${orbit.size}-${orbit.tilt}`}
				className="absolute left-1/2 top-1/2 rounded-full p-px"
				style={{
					width: orbit.size,
					height: orbit.size,
					marginLeft: -orbit.size / 2,
					marginTop: -orbit.size / 2,
					transform: `rotate(${orbit.tilt}deg)`,
					background:
						'conic-gradient(from 180deg, rgba(34,211,238,0.7), rgba(59,130,246,0.85), rgba(168,85,247,0.85), rgba(34,211,238,0.7))',
				}}
				animate={{ rotate: 360 }}
				transition={{
					duration: orbit.duration,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'linear',
				}}
			>
				<div className="relative size-full rounded-full bg-transparent">
					<motion.span
						className="absolute left-1/2 top-0 size-3 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(125,211,252,0.9)]"
						animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.7, 1, 0.7] }}
						transition={{
							duration: 1.6 + index * 0.25,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						}}
					/>
				</div>
			</motion.div>
		))}
		<motion.div
			className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96)_0%,rgba(232,121,249,0.88)_28%,rgba(59,130,246,0.72)_68%,rgba(2,6,23,0)_100%)] shadow-[0_0_35px_rgba(168,85,247,0.5)]"
			animate={{ scale: [1, 1.07, 1] }}
			transition={{
				duration: 2.1,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
		/>
	</motion.div>
)

const AmbientParticles = () => (
	<div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
		<motion.div
			className="absolute left-[8%] top-[12%] size-48 rounded-full bg-cyan-300/15 blur-3xl"
			animate={{ x: [0, 18, 0], y: [0, -10, 0], scale: [1, 1.08, 1] }}
			transition={{
				duration: 8.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
		/>
		<motion.div
			className="absolute right-[6%] bottom-[6%] size-56 rounded-full bg-violet-300/14 blur-3xl"
			animate={{ x: [0, -22, 0], y: [0, 14, 0], scale: [1, 1.06, 1] }}
			transition={{
				duration: 9.7,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut',
			}}
		/>
	</div>
)

const AnimatedAtom = () => (
	<>
		<AmbientParticles />
		<HeadOrbit />
	</>
)

const heroImageCandidates = [
	'/images/login-cortex-head.png',
	'/images/login-hero.svg',
] as const

const useHeroImageSrc = () => {
	const [imageIndex, setImageIndex] = useState(0)

	const src = useMemo(() => {
		const safeIndex = Math.min(imageIndex, heroImageCandidates.length - 1)
		return heroImageCandidates[safeIndex] ?? '/images/login-hero.svg'
	}, [imageIndex])

	const handleError = () => {
		setImageIndex((current) =>
			Math.min(current + 1, heroImageCandidates.length - 1),
		)
	}

	return { src, handleError }
}

interface LoginScreenProps {
	oauthErrorMessage?: string | null
}

export const LoginScreen = ({ oauthErrorMessage = null }: LoginScreenProps) => {
	const { isLoading } = useAuthRedirect()
	const {
		mode,
		setMode,
		form,
		submit,
		isSubmitting,
		errorMessage,
		signInWithGoogle,
	} = useAuthForm()
	const heroImage = useHeroImageSrc()

	if (isLoading) {
		return (
			<main className="grid min-h-dvh place-items-center">
				<Loader2 className="size-6 animate-spin text-primary" />
			</main>
		)
	}

	const fullNameError = form.formState.errors.fullName?.message
	const emailError = form.formState.errors.email?.message
	const passwordError = form.formState.errors.password?.message

	return (
		<main className="min-h-dvh p-4 md:p-8">
			<div className="mx-auto grid min-h-[92dvh] max-w-7xl overflow-hidden rounded-3xl border border-border/70 surface-glass lg:grid-cols-[1.15fr_0.95fr]">
				<section className="relative hidden overflow-hidden bg-slate-900 text-white lg:block">
					<Image
						src={heroImage.src}
						alt="Cortex hero"
						fill
						className="object-cover object-[56%_48%]"
						sizes="(max-width: 1024px) 0px, 60vw"
						priority
						onError={heroImage.handleError}
					/>
					<div className="absolute inset-0 bg-gradient-to-br from-slate-950/78 via-blue-900/44 to-violet-900/46" />
					<AnimatedAtom />

					<Reveal
						className="relative z-20 flex h-full flex-col justify-between p-12"
						delay={0.08}
					>
						<AppLogo />

						<div className="max-w-xl space-y-6">
							<h1 className="font-[var(--font-space)] text-5xl leading-[1.05] tracking-tight">
								Bem-vindo ao{' '}
								<span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
									CORTEX
								</span>
							</h1>
							<h2 className="text-xl font-medium text-blue-100">
								Sistema de Diagnóstico para Conclusão de Projetos
							</h2>
							<p className="max-w-lg text-sm leading-relaxed text-blue-50/90">
								O CORTEX analisa quatro pilares estruturais que determinam a
								capacidade de um projeto ser levado até a conclusão. Identifique
								gargalos, receba um plano de ação personalizado e acompanhe sua
								evolução ao longo do tempo.
							</p>
						</div>

						<p className="text-xs uppercase tracking-[0.22em] text-blue-100/72">
							Sistema Comportamental Adaptativo
						</p>
					</Reveal>
				</section>

				<section className="grid place-items-center p-6 md:p-10 lg:p-12">
					<Reveal className="w-full max-w-[30rem]" delay={0.14}>
						<div className="mb-5 lg:hidden">
							<AppLogo />
						</div>

						<Card className="relative overflow-hidden border-border/75 bg-card/92 shadow-[0_16px_50px_rgba(2,8,23,0.2)]">
							<div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/12 to-transparent" />

							<CardHeader className="space-y-2 p-7 pb-4">
								<CardTitle className="font-[var(--font-space)] text-3xl leading-none tracking-tight">
									{mode === 'login' ? 'Acessar conta' : 'Criar conta'}
								</CardTitle>
								<CardDescription className="text-[15px] leading-relaxed text-muted-foreground/95">
									{mode === 'login'
										? 'Entre para acompanhar seu diagnóstico e plano estratégico'
										: 'Cadastre-se para iniciar seu primeiro ciclo diagnóstico'}
								</CardDescription>
							</CardHeader>

							<CardContent className="p-7 pt-2">
								<form className="space-y-5" onSubmit={submit}>
									{mode === 'register' && (
										<div className="space-y-2">
											<label
												htmlFor="fullName"
												className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
											>
												Nome completo
											</label>
											<Input
												id="fullName"
												placeholder="Seu nome"
												className="h-12 rounded-2xl border-border/75 bg-background/70 px-4"
												{...form.register('fullName')}
											/>
											{fullNameError && (
												<p className="text-xs text-red-500">{fullNameError}</p>
											)}
										</div>
									)}

									<div className="space-y-2">
										<label
											htmlFor="email"
											className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
										>
											Email
										</label>
										<Input
											id="email"
											type="email"
											placeholder="seu@email.com"
											className="h-12 rounded-2xl border-border/75 bg-background/70 px-4"
											{...form.register('email')}
										/>
										{emailError && (
											<p className="text-xs text-red-500">{emailError}</p>
										)}
									</div>

									<div className="space-y-2">
										<label
											htmlFor="password"
											className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
										>
											Senha
										</label>
										<Input
											id="password"
											type="password"
											placeholder="********"
											className="h-12 rounded-2xl border-border/75 bg-background/70 px-4"
											{...form.register('password')}
										/>
										{passwordError && (
											<p className="text-xs text-red-500">{passwordError}</p>
										)}
									</div>

									{(errorMessage || oauthErrorMessage) && (
										<p className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-500">
											<AlertCircle className="size-4" />
											{errorMessage ?? oauthErrorMessage}
										</p>
									)}

									<motion.div whileTap={{ scale: 0.99 }}>
										<Button
											type="submit"
											className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-[0_10px_30px_color-mix(in_oklch,var(--primary)_28%,transparent)]"
											disabled={isSubmitting}
										>
											{isSubmitting ? (
												<>
													<Loader2 className="size-4 animate-spin" />
													Processando...
												</>
											) : mode === 'login' ? (
												'Entrar'
											) : (
												'Cadastrar'
											)}
										</Button>
									</motion.div>

									<div className="relative py-1">
										<div className="h-px w-full bg-border/70" />
										<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
											ou continue com
										</span>
									</div>

									<Button
										type="button"
										variant="outline"
										className="h-12 w-full rounded-2xl border-blue-300/35 bg-blue-500/10 text-[15px] font-semibold text-blue-700 hover:bg-blue-500/16 dark:text-blue-200"
										onClick={signInWithGoogle}
									>
										<GoogleIcon />
										Continuar com Google
									</Button>
								</form>

								<div className="mt-7 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
									{mode === 'login' ? 'Não tem conta?' : 'Já possui conta?'}{' '}
									<button
										type="button"
										className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
										onClick={() =>
											setMode(mode === 'login' ? 'register' : 'login')
										}
									>
										{mode === 'login' ? 'Criar cadastro' : 'Entrar'}
									</button>
								</div>
							</CardContent>
						</Card>
					</Reveal>
				</section>
			</div>
		</main>
	)
}
