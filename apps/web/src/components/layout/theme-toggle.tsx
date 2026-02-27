'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { IconButton } from '@/components/animate-ui/components/buttons/icon'

export const ThemeToggle = () => {
	const { resolvedTheme, setTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'

	return (
		<IconButton
			variant="outline"
			size="sm"
			aria-label="Alternar tema"
			className="cursor-pointer"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
		>
			{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</IconButton>
	)
}
