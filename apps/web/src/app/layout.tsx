import type { Metadata, Viewport } from 'next'
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
	applicationName: 'CORTEX System',
	title: 'CORTEX System | Diagnóstico',
	description: 'CORTEX System para diagnóstico e evolução de projetos.',
	manifest: '/manifest.webmanifest',
	icons: {
		icon: [
			{ url: '/brand/logo-cortex.png', sizes: '192x192', type: 'image/png' },
			{ url: '/brand/logo-cortex.png', sizes: '512x512', type: 'image/png' },
		],
		shortcut: [{ url: '/brand/logo-cortex.png', type: 'image/png' }],
		apple: [{ url: '/brand/logo-cortex.png', sizes: '512x512' }],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'CORTEX System',
	},
	formatDetection: {
		telephone: false,
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#3169ff' },
		{ media: '(prefers-color-scheme: dark)', color: '#1f3f91' },
	],
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body
				className={`${manrope.variable} ${spaceGrotesk.variable} font-(--font-manrope) antialiased`}
			>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	)
}
