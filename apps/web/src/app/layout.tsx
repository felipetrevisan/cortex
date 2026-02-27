import type { Metadata } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'

const manrope = Manrope({
	variable: '--font-manrope',
	subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
	variable: '--font-space',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'CORTEX | Sistema de Diagnóstico',
	description: 'Sistema de Diagnóstico para Conclusão de Projetos',
	manifest: '/manifest.webmanifest',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body
				className={`${manrope.variable} ${spaceGrotesk.variable} font-[var(--font-manrope)] antialiased`}
			>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	)
}
